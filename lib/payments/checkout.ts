import { getCurrentUser } from "@/lib/auth/session";
import { getCurrentCartId, getCurrentCartVoucher, getPrivateOffer, getPrivateOfferGame, type CartItemRow } from "@/lib/cart";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutSnapshotItems, getPaymentProvider } from "@/lib/payments/providers";
import type { CheckoutCurrency, PaymentProviderId } from "@/lib/payments/types";
import { validateVoucherCode, VoucherServiceError } from "@/lib/vouchers/service";

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
  voucherCodes?: string[];
};

function checkoutCurrency(value: unknown): CheckoutCurrency {
  return value === "EUR" ? "EUR" : "USD";
}

async function getPaymentTaxSettings(providerId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("payment_settings")
    .select("tax_rate, tax_label")
    .eq("method", providerId)
    .maybeSingle<{ tax_rate: number; tax_label: string }>();
  return data ?? null;
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
      "id, cart_id, service_id, private_offer_id, selected_options, selected_options_snapshot, price_usd, price_eur, added_at, services(id, title, slug, image, description, base_price_usd, base_price_eur, options_schema, games(name, slug), service_categories(name, slug)), private_offers!left(id, title, slug, category, quantity, platform, additional_info, discount_percent, price_usd, games!inner(name, slug, image))",
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

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (currency === "EUR" ? Number(item.price_eur) : Number(item.price_usd)),
    0,
  );

  let voucher: { id: string; code: string; discountPercentage: number } | undefined;

  // 1. First check server-side cart session voucher
  const cartVoucher = await getCurrentCartVoucher(cartId);
  if (cartVoucher) {
    voucher = cartVoucher;
  } else {
    // 2. Fallback to voucherCodes from body (backwards compatibility / direct payloads)
    const voucherCodes = Array.isArray(body.voucherCodes)
      ? [...new Set(body.voucherCodes.filter((code): code is string => typeof code === "string").map((code) => code.trim()).filter(Boolean))]
      : [];

    if (voucherCodes.length > 1) {
      throw new CheckoutError("Only one voucher can be applied per order.", 400);
    }

    if (voucherCodes.length === 1) {
      try {
        voucher = await validateVoucherCode(voucherCodes[0], user.id);
      } catch (error) {
        if (error instanceof VoucherServiceError) {
          throw new CheckoutError(error.message, 400);
        }
        throw new CheckoutError("Unable to validate voucher.", 400);
      }
    }
  }

  const taxSettings = await getPaymentTaxSettings(providerId);

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
    taxRate: taxSettings?.tax_rate ?? 0,
    taxLabel: taxSettings?.tax_label ?? "Tax",
    voucher,
  });
}
