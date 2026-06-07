import type Stripe from "stripe";
import { getCartService, getServiceCategory, getServiceGame, type CartItemRow } from "@/lib/cart";
import { isCheckoutSnapshotItems, type CheckoutSnapshotItem } from "@/lib/checkout/snapshot";
import { createOrderReference, createTransactionReference } from "@/lib/order-ref";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe";

type FulfillmentResult =
  | { status: "existing"; orderCount: number; checkoutSessionId: string }
  | { status: "created"; orderCount: number; checkoutSessionId: string }
  | { status: "unpaid"; orderCount: 0 }
  | { status: "empty_cart"; orderCount: 0 };

function paymentIntentId(session: Stripe.Checkout.Session) {
  if (typeof session.payment_intent === "string") return session.payment_intent;
  return session.payment_intent?.id ?? session.id;
}

function checkoutSessionIdFromMetadata(session: Stripe.Checkout.Session) {
  return session.metadata?.checkoutSessionId ?? session.id;
}

async function getPaidSession(sessionOrId: Stripe.Checkout.Session | string) {
  if (typeof sessionOrId !== "string") return sessionOrId;

  return getStripeClient().checkout.sessions.retrieve(sessionOrId, {
    expand: ["payment_intent"],
  });
}

export async function fulfillStripeCheckoutSession(sessionOrId: Stripe.Checkout.Session | string): Promise<FulfillmentResult> {
  const session = await getPaidSession(sessionOrId);

  if (session.payment_status !== "paid") {
    return { status: "unpaid", orderCount: 0 };
  }

  const supabase = createAdminClient();
  const checkoutSessionId = checkoutSessionIdFromMetadata(session);
  const { data: existing, error: existingError } = await supabase
    .from("orders")
    .select("id")
    .eq("checkout_session_id", checkoutSessionId);

  if (existingError) throw existingError;
  if (existing?.length) return { status: "existing", orderCount: existing.length, checkoutSessionId };

  const { data: checkoutSession, error: checkoutError } = await supabase
    .from("checkout_sessions")
    .select("id, cart_id, user_id, currency, items, created_at")
    .eq("id", checkoutSessionId)
    .maybeSingle<{
      id: string;
      cart_id: string;
      user_id: string;
      currency: "USD" | "EUR";
      items: unknown;
      created_at: string;
    }>();

  if (checkoutError) throw checkoutError;

  if (!checkoutSession) {
    throw new Error("Missing checkout snapshot for Stripe session.");
  }

  if (checkoutSession.user_id !== session.metadata?.userId || checkoutSession.cart_id !== session.metadata?.cartId) {
    throw new Error("Stripe checkout metadata does not match the checkout snapshot.");
  }

  if (!isCheckoutSnapshotItems(checkoutSession.items) || checkoutSession.items.length === 0) {
    return { status: "empty_cart", orderCount: 0 };
  }

  const stripePaymentIntentId = paymentIntentId(session);
  const currency = checkoutSession.currency;
  const referenceDate = new Date(checkoutSession.created_at);
  const amountTotal =
    typeof session.amount_total === "number"
      ? session.amount_total / 100
      : checkoutSession.items.reduce((total, item) => total + (currency === "EUR" ? item.priceEUR : item.priceUSD), 0);

  const { error: transactionError } = await supabase.from("transactions").upsert(
    {
      checkout_session_id: checkoutSession.id,
      transaction_ref: createTransactionReference(referenceDate, checkoutSession.id),
      user_id: checkoutSession.user_id,
      provider: "stripe",
      provider_payment_id: stripePaymentIntentId,
      provider_session_id: session.id,
      amount: amountTotal,
      currency,
      method: "Stripe Checkout",
      status: "success",
      refund_status: "none",
      raw_provider_payload: {
        id: session.id,
        mode: session.mode,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        payment_intent: stripePaymentIntentId,
      },
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

  const { error: clearError } = await supabase.from("cart_items").delete().eq("cart_id", checkoutSession.cart_id);
  if (clearError) throw clearError;

  await supabase
    .from("checkout_sessions")
    .update({ status: "fulfilled", fulfilled_at: new Date().toISOString() })
    .eq("id", checkoutSession.id);

  await supabase.from("carts").update({ updated_at: new Date().toISOString() }).eq("id", checkoutSession.cart_id);

  return { status: "created", orderCount: checkoutSession.items.length, checkoutSessionId: checkoutSession.id };
}

export function cartItemToStripeProduct(item: CartItemRow) {
  const service = getCartService(item);
  const game = getServiceGame(service);
  const category = getServiceCategory(service);
  const image = service?.image?.startsWith("http") ? service.image : undefined;

  return {
    name: service?.title ?? "Moon Strike Service",
    description: [game?.name, category?.name].filter(Boolean).join(" / ") || undefined,
    images: image ? [image] : undefined,
  };
}
