import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getCurrentCartId, type CartItemRow } from "@/lib/cart";
import { snapshotFromCartItem } from "@/lib/checkout/snapshot";
import { cartItemToStripeProduct } from "@/lib/checkout/stripe-fulfillment";
import { createNowPaymentsInvoice } from "@/lib/nowpayments";
import { createAdminClient } from "@/lib/supabase/admin";

type CheckoutRequestBody = {
  currency?: string;
};

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in to continue checkout." }, { status: 401 });
  }

  if (!user.email_confirmed_at) {
    return NextResponse.json({ error: "Please verify your email before checkout." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as CheckoutRequestBody;
  const currency = body.currency === "EUR" ? "EUR" : "USD";
  const cartId = await getCurrentCartId();

  if (!cartId) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: cartItems, error: cartError } = await supabase
    .from("cart_items")
    .select(
      "id, cart_id, service_id, selected_options, selected_options_snapshot, price_usd, price_eur, added_at, services(id, title, slug, image, description, base_price_usd, base_price_eur, options_schema, games(name, slug), service_categories(name, slug))",
    )
    .eq("cart_id", cartId)
    .order("added_at", { ascending: true })
    .returns<CartItemRow[]>();

  if (cartError) {
    return NextResponse.json({ error: cartError.message }, { status: 500 });
  }

  if (!cartItems?.length) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const checkoutSessionId = `np_${randomUUID()}`;
  const snapshotItems = cartItems.map((item) => snapshotFromCartItem(item, cartItemToStripeProduct(item)));
  const total = cartItems.reduce((sum, item) => sum + (currency === "EUR" ? Number(item.price_eur) : Number(item.price_usd)), 0);
  const serviceNames = snapshotItems.map((item) => item.product.name).join(", ");

  const { error: snapshotError } = await supabase.from("checkout_sessions").upsert({
    id: checkoutSessionId,
    cart_id: cartId,
    user_id: user.id,
    currency,
    provider: "nowpayments",
    status: "creating_invoice",
    items: snapshotItems,
  });

  if (snapshotError) {
    return NextResponse.json({ error: snapshotError.message }, { status: 500 });
  }

  let invoice;

  try {
    invoice = await createNowPaymentsInvoice({
      priceAmount: total,
      priceCurrency: currency.toLowerCase() as "usd" | "eur",
      orderId: checkoutSessionId,
      orderDescription: serviceNames || "Moon Strike services",
      ipnCallbackUrl: `${origin}/api/v1/webhooks/nowpayments`,
      successUrl: `${origin}/order-confirmed?session=${checkoutSessionId}`,
      cancelUrl: `${origin}/checkout?canceled=1`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create NOWPayments invoice.";

    await supabase
      .from("checkout_sessions")
      .update({ status: "invoice_failed" })
      .eq("id", checkoutSessionId);

    return NextResponse.json({ error: message }, { status: 502 });
  }

  const { error: updateSnapshotError } = await supabase.from("checkout_sessions").update({
    status: "created",
  }).eq("id", checkoutSessionId);

  if (updateSnapshotError) {
    return NextResponse.json({ error: updateSnapshotError.message }, { status: 500 });
  }

  return NextResponse.json({
    checkoutSessionId,
    providerInvoiceId: invoice.id,
    redirectTo: invoice.invoice_url,
  });
}
