import { createHash, randomUUID } from "crypto";
import { cartItemToCheckoutProduct } from "@/lib/checkout/product";
import { snapshotFromCartItem } from "@/lib/checkout/snapshot";
import { createNowPaymentsInvoice } from "@/lib/nowpayments";
import { getStripeClient } from "@/lib/stripe";
import type {
  PaymentCheckoutInput,
  PaymentCheckoutResult,
  PaymentProvider,
  PaymentProviderId,
  ProviderRefundInput,
  ProviderRefundResult,
} from "@/lib/payments/types";

export class ProviderRefundError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ProviderRefundError";
    this.status = status;
  }
}

function checkoutTotal(input: PaymentCheckoutInput) {
  return input.cartItems.reduce(
    (sum, item) => sum + (input.currency === "EUR" ? Number(item.price_eur) : Number(item.price_usd)),
    0,
  );
}

async function createStripeCheckout(input: PaymentCheckoutInput): Promise<PaymentCheckoutResult> {
  const stripe = getStripeClient();
  const cartFingerprint = [
    input.user.id,
    input.cartId,
    input.cartItems.map((item) => `${item.id}:${item.added_at}:${item.price_usd}:${item.price_eur}`).join("|"),
    input.currency,
  ].join(":");
  const checkoutFingerprint = createHash("sha256").update(cartFingerprint).digest("hex");
  const checkoutSessionId = `co_${checkoutFingerprint.slice(0, 32)}`;
  const idempotencyKey = `checkout:${checkoutFingerprint}`;

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      customer_email: input.user.email ?? undefined,
      client_reference_id: input.user.id,
      line_items: input.cartItems.map((item, index) => ({
        quantity: 1,
        price_data: {
          currency: input.currency.toLowerCase(),
          unit_amount: Math.max(
            50,
            Math.round((input.currency === "EUR" ? Number(item.price_eur) : Number(item.price_usd)) * 100),
          ),
          product_data: input.snapshotItems[index].product,
        },
      })),
      metadata: {
        cartId: input.cartId,
        checkoutSessionId,
        userId: input.user.id,
        currency: input.currency,
      },
      success_url: `${input.origin}/order-confirmed?session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${input.origin}/checkout?canceled=1`,
    },
    {
      idempotencyKey,
    },
  );

  const { error } = await input.supabase.from("checkout_sessions").upsert({
    id: checkoutSessionId,
    cart_id: input.cartId,
    user_id: input.user.id,
    currency: input.currency,
    provider: "stripe",
    status: "created",
    items: input.snapshotItems,
  });

  if (error) throw error;

  return {
    checkoutSessionId,
    providerSessionId: session.id,
    redirectTo: session.url,
  };
}

async function createNowPaymentsCheckout(input: PaymentCheckoutInput): Promise<PaymentCheckoutResult> {
  const checkoutSessionId = `np_${randomUUID()}`;
  const total = checkoutTotal(input);
  const serviceNames = input.snapshotItems.map((item) => item.product.name).join(", ");

  const { error: snapshotError } = await input.supabase.from("checkout_sessions").upsert({
    id: checkoutSessionId,
    cart_id: input.cartId,
    user_id: input.user.id,
    currency: input.currency,
    provider: "nowpayments",
    status: "creating_invoice",
    items: input.snapshotItems,
  });

  if (snapshotError) throw snapshotError;

  let invoice;

  try {
    invoice = await createNowPaymentsInvoice({
      priceAmount: total,
      priceCurrency: input.currency.toLowerCase() as "usd" | "eur",
      orderId: checkoutSessionId,
      orderDescription: serviceNames || "Moon Strike services",
      ipnCallbackUrl: `${input.origin}/api/v1/webhooks/nowpayments`,
      successUrl: `${input.origin}/order-confirmed?session=${checkoutSessionId}`,
      cancelUrl: `${input.origin}/checkout?canceled=1`,
    });
  } catch (error) {
    await input.supabase.from("checkout_sessions").update({ status: "invoice_failed" }).eq("id", checkoutSessionId);
    throw error;
  }

  const { error: updateError } = await input.supabase
    .from("checkout_sessions")
    .update({ status: "created" })
    .eq("id", checkoutSessionId);

  if (updateError) throw updateError;

  return {
    checkoutSessionId,
    providerInvoiceId: invoice.id,
    redirectTo: invoice.invoice_url,
  };
}

async function refundStripe(input: ProviderRefundInput): Promise<ProviderRefundResult> {
  if (input.mode === "manual") {
    return refundManually(input, "stripe");
  }

  const refund = await getStripeClient().refunds.create({
    payment_intent: input.transaction.providerPaymentId,
    amount: Math.round(input.amount * 100),
    reason: "requested_by_customer",
    metadata: {
      order_id: input.order.id,
      checkout_session_id: input.order.checkoutSessionId,
    },
  });

  return {
    providerRefundId: refund.id,
    manual: false,
    payload: {
      id: refund.id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason,
    },
  };
}

async function refundManually(input: ProviderRefundInput, provider: PaymentProviderId): Promise<ProviderRefundResult> {
  return {
    providerRefundId: null,
    manual: true,
    payload: {
      manual: true,
      provider,
      mode: "manual",
      amount: input.amount,
      currency: input.transaction.currency,
      recorded_at: new Date().toISOString(),
    },
  };
}

export const paymentProviders: Record<PaymentProviderId, PaymentProvider> = {
  stripe: {
    id: "stripe",
    label: "Stripe",
    refundCapabilities: {
      automatic: true,
      manual: true,
    },
    createCheckout: createStripeCheckout,
    refund: refundStripe,
  },
  nowpayments: {
    id: "nowpayments",
    label: "NOWPayments",
    refundCapabilities: {
      automatic: false,
      manual: true,
    },
    createCheckout: createNowPaymentsCheckout,
    refund: (input) => {
      if (input.mode === "automatic") {
        throw new ProviderRefundError("NOWPayments automatic refunds are not available. Complete the crypto refund externally, then record it manually.");
      }

      return refundManually(input, "nowpayments");
    },
  },
};

export function getPaymentProvider(provider: PaymentProviderId) {
  return paymentProviders[provider];
}

export function checkoutSnapshotItems(input: Pick<PaymentCheckoutInput, "cartItems">) {
  return input.cartItems.map((item) => snapshotFromCartItem(item, cartItemToCheckoutProduct(item)));
}
