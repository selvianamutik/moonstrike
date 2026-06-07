import { createAdminClient } from "@/lib/supabase/admin";

export type CustomerTransaction = {
  id: string;
  checkoutSessionId: string;
  amount: number;
  currency: "USD" | "EUR";
  method: string;
  provider: string;
  status: string;
  createdAt: string;
};

export type CustomerTransactionDetail = CustomerTransaction & {
  orderReference: string | null;
  providerPaymentId: string;
  providerSessionId: string | null;
  refundStatus: string;
  refundedAt: string | null;
  providerRefundId: string | null;
  refundAmount: number | null;
  refundCurrency: "USD" | "EUR" | null;
  updatedAt: string;
};

type CustomerTransactionRow = {
  id: string;
  transaction_ref: string;
  provider_payment_id: string;
  provider_session_id: string | null;
  checkout_session_id: string;
  amount: number | string;
  currency: "USD" | "EUR";
  provider: string;
  status: string;
  refund_status: string;
  refunded_at: string | null;
  provider_refund_id: string | null;
  refund_amount: number | string | null;
  refund_currency: "USD" | "EUR" | null;
  created_at: string;
  updated_at: string;
};

type CustomerTransactionOrderRow = {
  order_ref: string;
};

export async function listCustomerTransactions(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("id, transaction_ref, provider_payment_id, checkout_session_id, amount, currency, provider, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<CustomerTransactionRow[]>();

  if (error) throw error;

  return (data ?? []).map((transaction) => ({
    id: transaction.transaction_ref,
    checkoutSessionId: transaction.checkout_session_id,
    amount: Number(transaction.amount),
    currency: transaction.currency,
    method: transaction.provider,
    provider: transaction.provider,
    status: transaction.status,
    createdAt: transaction.created_at,
  }));
}

export async function getCustomerTransaction(userId: string, transactionId: string) {
  const supabase = createAdminClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(transactionId);
  const query = supabase
    .from("transactions")
    .select(
      "id, transaction_ref, provider_payment_id, provider_session_id, checkout_session_id, amount, currency, provider, status, refund_status, refunded_at, provider_refund_id, refund_amount, refund_currency, created_at, updated_at",
    )
    .eq("user_id", userId);

  const { data, error } = await (isUuid ? query.eq("id", transactionId) : query.eq("transaction_ref", transactionId)).maybeSingle<CustomerTransactionRow>();

  if (error) throw error;
  if (!data) return null;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("order_ref")
    .eq("user_id", userId)
    .eq("checkout_session_id", data.checkout_session_id)
    .maybeSingle<CustomerTransactionOrderRow>();

  if (orderError) throw orderError;

  return {
    id: data.transaction_ref,
    checkoutSessionId: data.checkout_session_id,
    amount: Number(data.amount),
    currency: data.currency,
    method: data.provider,
    provider: data.provider,
    status: data.status,
    createdAt: data.created_at,
    orderReference: order?.order_ref ?? null,
    providerPaymentId: data.provider_payment_id,
    providerSessionId: data.provider_session_id,
    refundStatus: data.refund_status,
    refundedAt: data.refunded_at,
    providerRefundId: data.provider_refund_id,
    refundAmount: data.refund_amount === null ? null : Number(data.refund_amount),
    refundCurrency: data.refund_currency,
    updatedAt: data.updated_at,
  } satisfies CustomerTransactionDetail;
}

export function formatTransactionMoney(value: number, currency: "USD" | "EUR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}
