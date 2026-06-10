import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CartItemRow } from "@/lib/cart";
import type { CheckoutSnapshotItem } from "@/lib/checkout/snapshot";

export type PaymentProviderId = "stripe" | "nowpayments";
export type CheckoutCurrency = "USD" | "EUR";
export type RefundMode = "automatic" | "manual";

export type PaymentCheckoutInput = {
  user: User;
  cartId: string;
  cartItems: CartItemRow[];
  snapshotItems: CheckoutSnapshotItem[];
  currency: CheckoutCurrency;
  origin: string;
  supabase: SupabaseClient;
};

export type PaymentCheckoutResult = {
  checkoutSessionId: string;
  redirectTo: string | null;
  providerSessionId?: string;
  providerInvoiceId?: string;
};

export type ProviderRefundInput = {
  order: {
    id: string;
    checkoutSessionId: string;
  };
  transaction: {
    providerPaymentId: string;
    currency: CheckoutCurrency;
    rawProviderPayload: Record<string, unknown> | null;
  };
  amount: number;
  mode: RefundMode;
};

export type ProviderRefundResult = {
  providerRefundId: string | null;
  manual: boolean;
  payload: Record<string, unknown>;
};

export type PaymentProvider = {
  id: PaymentProviderId;
  label: string;
  refundCapabilities: {
    automatic: boolean;
    manual: boolean;
  };
  createCheckout(input: PaymentCheckoutInput): Promise<PaymentCheckoutResult>;
  refund(input: ProviderRefundInput): Promise<ProviderRefundResult>;
};
