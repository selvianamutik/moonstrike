import { isCheckoutSnapshotItems, type CheckoutSnapshotItem } from "@/lib/checkout/snapshot";
import { createOrderReference, createTransactionReference } from "@/lib/order-ref";
import { createAdminClient } from "@/lib/supabase/admin";

export type NowPaymentsIpnPayload = {
  payment_id?: string | number;
  invoice_id?: string | number;
  order_id?: string;
  payment_status?: string;
  pay_address?: string;
  price_amount?: number | string;
  price_currency?: string;
  pay_amount?: number | string;
  pay_currency?: string;
  purchase_id?: string | number;
  actually_paid?: number | string;
  outcome_amount?: number | string;
  outcome_currency?: string;
};

type FulfillmentResult =
  | { status: "existing"; orderCount: number }
  | { status: "created"; orderCount: number }
  | { status: "ignored"; orderCount: 0 }
  | { status: "empty_cart"; orderCount: 0 };

function stringValue(value: string | number | undefined) {
  return value === undefined ? undefined : String(value);
}

function paymentReference(payload: NowPaymentsIpnPayload) {
  return stringValue(payload.payment_id) ?? stringValue(payload.invoice_id) ?? stringValue(payload.purchase_id);
}

export async function fulfillNowPaymentsCheckout(payload: NowPaymentsIpnPayload): Promise<FulfillmentResult> {
  const checkoutSessionId = payload.order_id;

  if (!checkoutSessionId) {
    throw new Error("NOWPayments IPN did not include order_id.");
  }

  const status = payload.payment_status;
  const supabase = createAdminClient();

  if (status !== "finished") {
    await supabase
      .from("checkout_sessions")
      .update({ status: status ?? "unknown" })
      .eq("id", checkoutSessionId)
      .eq("provider", "nowpayments");

    return { status: "ignored", orderCount: 0 };
  }

  const { data: existing, error: existingError } = await supabase
    .from("orders")
    .select("id")
    .eq("checkout_session_id", checkoutSessionId);

  if (existingError) throw existingError;
  if (existing?.length) return { status: "existing", orderCount: existing.length };

  const { data: checkoutSession, error: checkoutError } = await supabase
    .from("checkout_sessions")
    .select("id, cart_id, user_id, currency, items, created_at")
    .eq("id", checkoutSessionId)
    .eq("provider", "nowpayments")
    .maybeSingle<{
      id: string;
      cart_id: string;
      user_id: string;
      currency: "USD" | "EUR";
      items: unknown;
      created_at: string;
    }>();

  if (checkoutError) throw checkoutError;
  if (!checkoutSession) throw new Error("Missing NOWPayments checkout snapshot.");

  if (!isCheckoutSnapshotItems(checkoutSession.items) || checkoutSession.items.length === 0) {
    return { status: "empty_cart", orderCount: 0 };
  }

  const providerPaymentId = paymentReference(payload);
  if (!providerPaymentId) {
    throw new Error("NOWPayments IPN did not include a usable payment reference.");
  }

  const currency = checkoutSession.currency;
  const referenceDate = new Date(checkoutSession.created_at);
  const orderTotal = checkoutSession.items.reduce((total, item) => total + (currency === "EUR" ? item.priceEUR : item.priceUSD), 0);
  const completedAt = new Date().toISOString();

  const { error: transactionError } = await supabase.from("transactions").upsert(
    {
      checkout_session_id: checkoutSession.id,
      transaction_ref: createTransactionReference(referenceDate, checkoutSession.id),
      user_id: checkoutSession.user_id,
      provider: "nowpayments",
      provider_payment_id: providerPaymentId,
      provider_session_id: stringValue(payload.invoice_id),
      amount: orderTotal,
      currency,
      method: `NOWPayments${payload.pay_currency ? ` (${payload.pay_currency.toUpperCase()})` : ""}`,
      status: "success",
      refund_status: "none",
      raw_provider_payload: payload,
      updated_at: completedAt,
    },
    { onConflict: "checkout_session_id" },
  );
  if (transactionError) throw transactionError;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .upsert(
      {
        order_ref: createOrderReference(referenceDate, checkoutSession.id),
        user_id: checkoutSession.user_id,
        checkout_session_id: checkoutSession.id,
        status: "pending",
      },
      {
        onConflict: "checkout_session_id",
      },
    )
    .select("id")
    .single<{ id: string }>();

  if (orderError) throw orderError;

  const orderItemRows = checkoutSession.items.map((item: CheckoutSnapshotItem) => ({
    order_id: order.id,
    cart_item_id: item.cartItemId,
    service_id: item.serviceId,
    selected_options_snapshot: item.selectedOptionsSnapshot,
    total: currency === "EUR" ? item.priceEUR : item.priceUSD,
    currency,
  }));

  const { error: insertError } = await supabase
    .from("order_items")
    .upsert(orderItemRows, {
      onConflict: "order_id,cart_item_id",
      ignoreDuplicates: true,
    });
  if (insertError) throw insertError;

  await supabase.from("cart_items").delete().eq("cart_id", checkoutSession.cart_id);
  await supabase
    .from("checkout_sessions")
    .update({ status: "fulfilled", fulfilled_at: completedAt })
    .eq("id", checkoutSession.id);
  await supabase.from("carts").update({ updated_at: completedAt }).eq("id", checkoutSession.cart_id);

  return { status: "created", orderCount: checkoutSession.items.length };
}
