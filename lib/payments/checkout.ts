import { getCurrentUser } from "@/lib/auth/session";
import { getCurrentCartId, type CartItemRow } from "@/lib/cart";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutSnapshotItems, getPaymentProvider } from "@/lib/payments/providers";
import type { CheckoutCurrency, PaymentProviderId } from "@/lib/payments/types";

export class CheckoutError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CheckoutError";
    this.status = status;
  }
}

type CheckoutRequestBody = {
  currency?: string;
};

function checkoutCurrency(value: unknown): CheckoutCurrency {
  return value === "EUR" ? "EUR" : "USD";
}

export async function createPaymentCheckout(providerId: PaymentProviderId, request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    throw new CheckoutError("Please log in to continue checkout.", 401);
  }

  if (!user.email_confirmed_at) {
    throw new CheckoutError("Please verify your email before checkout.", 403);
  }

  const body = (await request.json().catch(() => ({}))) as CheckoutRequestBody;
  const currency = checkoutCurrency(body.currency);
  const cartId = await getCurrentCartId();

  if (!cartId) {
    throw new CheckoutError("Your cart is empty.", 400);
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
    throw new CheckoutError(cartError.message, 500);
  }

  if (!cartItems?.length) {
    throw new CheckoutError("Your cart is empty.", 400);
  }

  const provider = getPaymentProvider(providerId);
  const origin = new URL(request.url).origin;

  return provider.createCheckout({
    user,
    cartId,
    cartItems,
    snapshotItems: checkoutSnapshotItems({ cartItems }),
    currency,
    origin,
    supabase,
  });
}
