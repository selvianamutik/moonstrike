import { isCheckoutSnapshotItems, type CheckoutSnapshotItem } from "@/lib/checkout/snapshot";
import { enqueueGoogleSheetsSync } from "@/lib/admin/google-sheets-sync";
import { notifyOrderCreated } from "@/lib/notifications";
import { createOrderReference, createTransactionReference } from "@/lib/order-ref";
import { createAdminClient } from "@/lib/supabase/admin";
import { capturePayPalOrder, getPayPalOrder } from "@/lib/paypal";

type FulfillmentResult =
  | { status: "existing"; orderCount: number; checkoutSessionId: string }
  | { status: "created"; orderCount: number; checkoutSessionId: string }
  | { status: "unpaid"; orderCount: 0 }
  | { status: "empty_cart"; orderCount: 0 };

export async function fulfillPayPalCheckoutSession(checkoutSessionId: string, paypalOrderId: string): Promise<FulfillmentResult> {

  const supabase = createAdminClient();

  // Check if order already exists
  const { data: existing, error: existingError } = await supabase
    .from("orders")
    .select("id")
    .eq("checkout_session_id", checkoutSessionId);

  if (existingError) throw existingError;
  if (existing?.length) {
    return { status: "existing", orderCount: existing.length, checkoutSessionId };
  }

  // Get checkout session
  const { data: checkoutSession, error: checkoutError } = await supabase
    .from("checkout_sessions")
    .select("id, user_id, currency, items, cart_id")
    .eq("id", checkoutSessionId)
    .maybeSingle<{
      id: string;
      user_id: string;
      currency: "USD" | "EUR";
      items: unknown;
      cart_id: string | null;
    }>();

  if (checkoutError) throw checkoutError;
  if (!checkoutSession) {
    return { status: "empty_cart", orderCount: 0 };
  }

  if (!isCheckoutSnapshotItems(checkoutSession.items)) {
    return { status: "empty_cart", orderCount: 0 };
  }

  // Get PayPal order details
  const paypalOrder = await getPayPalOrder(paypalOrderId);

  let captureResult;
  let capture;

  if (paypalOrder.status === "COMPLETED") {
    // Payment already captured, get capture details from order
    captureResult = paypalOrder as any;
    capture = paypalOrder.purchase_units?.[0]?.payments?.captures?.[0];
    
    if (!capture) {
      return { status: "unpaid", orderCount: 0 };
    }
  } else if (paypalOrder.status === "APPROVED") {
    // Payment approved but not captured yet, capture it now
    captureResult = await capturePayPalOrder(paypalOrderId);

    if (captureResult.status !== "COMPLETED") {
      return { status: "unpaid", orderCount: 0 };
    }

    capture = captureResult.purchase_units[0]?.payments?.captures?.[0];
    if (!capture) {
      return { status: "unpaid", orderCount: 0 };
    }
  } else {
    return { status: "unpaid", orderCount: 0 };
  }

  // Create single order
  const items = checkoutSession.items as CheckoutSnapshotItem[];
  const orderRef = createOrderReference();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .upsert(
      {
        order_ref: orderRef,
        user_id: checkoutSession.user_id,
        checkout_session_id: checkoutSessionId,
        status: "pending",
      },
      {
        onConflict: "checkout_session_id",
      },
    )
    .select("id")
    .single<{ id: string }>();

  if (orderError) throw orderError;

  // Create order items
  const orderItemRows = items.map((item) => ({
    order_id: order.id,
    cart_item_id: item.cartItemId,
    service_id: item.serviceId,
    selected_options_snapshot: item.selectedOptionsSnapshot,
    total: checkoutSession.currency === "EUR" ? item.priceEUR : item.priceUSD,
    currency: checkoutSession.currency,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .upsert(orderItemRows, {
      onConflict: "order_id,cart_item_id",
      ignoreDuplicates: true,
    });

  if (itemsError) throw itemsError;

  // Create transaction
  const totalAmount = items.reduce(
    (sum, item) => sum + (checkoutSession.currency === "EUR" ? item.priceEUR : item.priceUSD),
    0,
  );

  const { error: txError } = await supabase.from("transactions").insert({
    user_id: checkoutSession.user_id,
    checkout_session_id: checkoutSessionId,
    provider: "paypal",
    provider_payment_id: capture.id,
    provider_session_id: paypalOrderId,
    amount: totalAmount,
    currency: checkoutSession.currency,
    method: "PayPal",
    status: "success",
    refund_status: "none",
    transaction_ref: createTransactionReference(),
    raw_provider_payload: {
      capture_id: capture.id,
      order_id: paypalOrderId,
      payer_id: captureResult.purchase_units[0]?.payee?.merchant_id,
      capture_status: capture.status,
      amount: capture.amount,
    },
  });

  if (txError) throw txError;

  // Send notification
  await notifyOrderCreated({
    orderId: order.id,
    orderRef,
    userId: checkoutSession.user_id,
    serviceNames: items.map((item) => item.product.name),
  }).catch(() => {
    // Notification failure is non-critical
  });

  // Clear cart
  if (checkoutSession.cart_id) {
    const { error: clearError } = await supabase.from("cart_items").delete().eq("cart_id", checkoutSession.cart_id);
    if (clearError) {
      // Cart clearing failure is non-critical
    }
  }

  // Update checkout session status
  await supabase
    .from("checkout_sessions")
    .update({ status: "fulfilled", fulfilled_at: new Date().toISOString() })
    .eq("id", checkoutSessionId);

  // Update cart timestamp
  if (checkoutSession.cart_id) {
    await supabase.from("carts").update({ updated_at: new Date().toISOString() }).eq("id", checkoutSession.cart_id);
  }

  // Enqueue Google Sheets sync
  await enqueueGoogleSheetsSync("all").catch(() => {
    // Sheets sync failure is non-critical
  });

  return { status: "created", orderCount: items.length, checkoutSessionId };
}
