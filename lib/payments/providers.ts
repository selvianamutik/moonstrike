import { randomUUID } from "crypto";
import { cartItemToCheckoutProduct } from "@/lib/checkout/product";
import { snapshotFromCartItem } from "@/lib/checkout/snapshot";
import { createNowPaymentsInvoice } from "@/lib/nowpayments";
import { createPayPalOrder, refundPayPalCapture, isPayPalConfigured } from "@/lib/paypal";
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

function applyTax(amount: number, input: PaymentCheckoutInput) {
  if (!input.taxRate) return 0;
  return Number((amount * input.taxRate).toFixed(2));
}


async function createNowPaymentsCheckout(input: PaymentCheckoutInput): Promise<PaymentCheckoutResult> {
  const checkoutSessionId = `np_${randomUUID()}`;
  const subtotal = checkoutTotal(input);
  const taxAmount = applyTax(subtotal, input);
  const total = subtotal + taxAmount;
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


async function createPayPalCheckout(input: PaymentCheckoutInput): Promise<PaymentCheckoutResult> {
  if (!isPayPalConfigured()) {
    throw new Error("PayPal is not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.");
  }

  const checkoutSessionId = `pp_${randomUUID()}`;

  const { error: snapshotError } = await input.supabase.from("checkout_sessions").upsert({
    id: checkoutSessionId,
    cart_id: input.cartId,
    user_id: input.user.id,
    currency: input.currency,
    provider: "paypal",
    status: "creating_order",
    items: input.snapshotItems,
  });

  if (snapshotError) throw snapshotError;

  let order;

  try {
    const itemTotal = input.snapshotItems.reduce(
      (sum, item) => sum + (input.currency === "EUR" ? (item.priceEUR ?? 0) : (item.priceUSD ?? 0)),
      0,
    );
    const taxAmount = applyTax(itemTotal, input);
    const paypalItems = input.snapshotItems.map((item) => {
      const price = input.currency === "EUR" ? item.priceEUR : item.priceUSD;
      const priceValue = typeof price === 'number' && !isNaN(price) ? price : 0;
      
      return {
        name: item.product.name,
        description: item.product.description || undefined,
        quantity: "1",
        unit_amount: {
          currency_code: input.currency,
          value: priceValue.toFixed(2),
        },
      };
    });

    if (taxAmount > 0) {
      paypalItems.push({
        name: input.taxLabel ?? "Tax",
        description: undefined,
        quantity: "1",
        unit_amount: {
          currency_code: input.currency,
          value: taxAmount.toFixed(2),
        },
      });
    }

    order = await createPayPalOrder({
      items: paypalItems,
      currency: input.currency,
      returnUrl: `${input.origin}/order-confirmed?session=${checkoutSessionId}`,
      cancelUrl: `${input.origin}/checkout?canceled=1`,
      metadata: {
        checkoutSessionId,
        cartId: input.cartId,
        userId: input.user.id,
      },
    });
  } catch (error) {
    await input.supabase.from("checkout_sessions").update({ status: "order_failed" }).eq("id", checkoutSessionId);
    throw error;
  }

  const approvalUrl = order.links.find((link) => link.rel === "approve")?.href;

  if (!approvalUrl) {
    throw new Error("PayPal did not return an approval URL. Please check PayPal configuration.");
  }

  const { error: updateError } = await input.supabase
    .from("checkout_sessions")
    .update({ status: "created" })
    .eq("id", checkoutSessionId);

  if (updateError) throw updateError;

  return {
    checkoutSessionId,
    providerSessionId: order.id,
    redirectTo: approvalUrl,
  };
}

async function refundPayPal(input: ProviderRefundInput): Promise<ProviderRefundResult> {
  if (input.mode === "manual") {
    return refundManually(input, "paypal");
  }

  if (!input.transaction.rawProviderPayload) {
    throw new ProviderRefundError(
      "Cannot process automatic PayPal refund: missing transaction payload. Use manual refund instead.",
      400,
    );
  }

  const captureId = (input.transaction.rawProviderPayload as { capture_id?: string }).capture_id;

  if (!captureId) {
    throw new ProviderRefundError(
      "Cannot process automatic PayPal refund: missing capture ID. Use manual refund instead.",
      400,
    );
  }

  const refund = await refundPayPalCapture({
    captureId,
    amount: {
      currency_code: input.transaction.currency,
      value: input.amount.toFixed(2),
    },
    note_to_payer: "Refund requested by customer",
  });

  return {
    providerRefundId: refund.id,
    manual: false,
    payload: {
      id: refund.id,
      amount: refund.amount.value,
      currency: refund.amount.currency_code,
      status: refund.status,
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
  paypal: {
    id: "paypal",
    label: "PayPal",
    refundCapabilities: {
      automatic: true,
      manual: true,
    },
    createCheckout: createPayPalCheckout,
    refund: refundPayPal,
  },
};

export function getPaymentProvider(provider: PaymentProviderId) {
  return paymentProviders[provider];
}

export function checkoutSnapshotItems(input: Pick<PaymentCheckoutInput, "cartItems">) {
  return input.cartItems.map((item) => snapshotFromCartItem(item, cartItemToCheckoutProduct(item)));
}
