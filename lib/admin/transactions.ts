import { createAdminClient } from "@/lib/supabase/admin";

type AdminCustomer = { email?: string; user_metadata?: Record<string, unknown> } | null;

type TransactionRow = {
  id: string;
  transaction_ref: string;
  checkout_session_id: string;
  user_id: string;
  provider: "stripe" | "nowpayments";
  provider_payment_id: string;
  provider_session_id: string | null;
  amount: number | string;
  currency: "USD" | "EUR";
  status: "success" | "pending" | "disputed" | "refunded" | "failed";
  refund_status: string;
  created_at: string;
};

type TransactionDetailRow = TransactionRow & {
  refunded_at: string | null;
  provider_refund_id: string | null;
  refund_amount: number | string | null;
  refund_currency: "USD" | "EUR" | null;
  raw_provider_payload: Record<string, unknown>;
  updated_at: string;
};

type TransactionOrderRow = {
  id: string;
  order_ref: string;
  status: string;
};

export type AdminTransactionRecord = {
  id: string;
  checkoutSessionId: string;
  customerName: string;
  customerEmail: string;
  date: string;
  dateIso: string;
  amount: string;
  amountValue: number;
  currency: "USD" | "EUR";
  method: string;
  paymentProvider: "stripe" | "nowpayments";
  status: TransactionRow["status"];
  canRefund: boolean;
  refundBlockedReason?: string;
};

export type AdminTransactionDetail = AdminTransactionRecord & {
  databaseId: string;
  providerPaymentId: string;
  providerSessionId: string | null;
  orderId: string | null;
  orderReference: string | null;
  orderStatus: string | null;
  refundStatus: string;
  refundedAt: string | null;
  providerRefundId: string | null;
  refundAmount: string | null;
  rawProviderPayload: Record<string, unknown>;
  updatedAt: string;
};

export type AdminTransactionStats = {
  totalCollected: string;
  successfulCount: number;
  refundedCount: number;
  totalRefunded: string;
};

function customerName(user: AdminCustomer | undefined) {
  const metadata = user?.user_metadata ?? {};
  const displayName = metadata.username ?? metadata.full_name ?? metadata.name;
  return typeof displayName === "string" && displayName.trim() ? displayName.trim() : user?.email ?? "Customer";
}

function formatMoney(value: number | string, currency: "USD" | "EUR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function mapProviderName(provider: string) {
  if (provider === "stripe") return "stripe";
  if (provider === "nowpayments") return "nowpayments";
  return provider;
}

async function getCustomersById(userIds: string[]) {
  const supabase = createAdminClient();
  const uniqueIds = Array.from(new Set(userIds));
  const entries = await Promise.all(
    uniqueIds.map(async (id) => {
      const { data } = await supabase.auth.admin.getUserById(id);
      return [id, data.user as AdminCustomer] as const;
    }),
  );

  return new Map(entries);
}

export async function listAdminTransactions() {
  const supabase = createAdminClient();
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("id, transaction_ref, checkout_session_id, user_id, provider, provider_payment_id, provider_session_id, amount, currency, status, refund_status, created_at")
    .order("created_at", { ascending: false })
    .returns<TransactionRow[]>();

  if (error) throw error;

  const rows = transactions ?? [];
  const customers = await getCustomersById(rows.map((transaction) => transaction.user_id));

  const records = rows.map((transaction) => {
    const customer = customers.get(transaction.user_id);
    const name = customerName(customer);
    const email = customer?.email ?? transaction.user_id;
    const canRefund = transaction.status === "success" && transaction.refund_status === "none";

    return {
      id: transaction.transaction_ref,
      checkoutSessionId: transaction.checkout_session_id,
      customerName: name,
      customerEmail: email,
      date: formatDate(transaction.created_at),
      dateIso: transaction.created_at,
      amount: formatMoney(transaction.amount, transaction.currency),
      amountValue: Number(transaction.amount),
      currency: transaction.currency,
      method: transaction.provider,
      paymentProvider: transaction.provider,
      status: transaction.status,
      canRefund,
      refundBlockedReason: canRefund ? undefined : "Refund flow is not wired yet or transaction is not successful.",
    } satisfies AdminTransactionRecord;
  });
  const collectedTotals = rows.reduce(
    (sum, transaction) => {
      if (transaction.status === "success") sum[transaction.currency] += Number(transaction.amount);
      return sum;
    },
    { EUR: 0, USD: 0 },
  );
  const refundedTotals = rows.reduce(
    (sum, transaction) => {
      if (transaction.status === "refunded") sum[transaction.currency] += Number(transaction.amount);
      return sum;
    },
    { EUR: 0, USD: 0 },
  );
  const collectedParts = [];
  const refundedParts = [];

  if (collectedTotals.USD > 0) collectedParts.push(formatMoney(collectedTotals.USD, "USD"));
  if (collectedTotals.EUR > 0) collectedParts.push(formatMoney(collectedTotals.EUR, "EUR"));
  if (refundedTotals.USD > 0) refundedParts.push(formatMoney(refundedTotals.USD, "USD"));
  if (refundedTotals.EUR > 0) refundedParts.push(formatMoney(refundedTotals.EUR, "EUR"));

  return {
    records,
    stats: {
      totalCollected: collectedParts.join(" / ") || "$0.00",
      successfulCount: rows.filter((transaction) => transaction.status === "success").length,
      refundedCount: rows.filter((transaction) => transaction.status === "refunded").length,
      totalRefunded: refundedParts.join(" / ") || "$0.00",
    } satisfies AdminTransactionStats,
  };
}

export async function getAdminTransaction(transactionId: string) {
  const supabase = createAdminClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(transactionId);
  const query = supabase
    .from("transactions")
    .select(
      "id, transaction_ref, checkout_session_id, user_id, provider, provider_payment_id, provider_session_id, amount, currency, status, refund_status, refunded_at, provider_refund_id, refund_amount, refund_currency, raw_provider_payload, created_at, updated_at",
    );

  const { data, error } = await (isUuid ? query.eq("id", transactionId) : query.eq("transaction_ref", transactionId)).maybeSingle<TransactionDetailRow>();

  if (error) throw error;
  if (!data) return null;

  const [customers, orderResult] = await Promise.all([
    getCustomersById([data.user_id]),
    supabase
      .from("orders")
      .select("id, order_ref, status")
      .eq("checkout_session_id", data.checkout_session_id)
      .maybeSingle<TransactionOrderRow>(),
  ]);

  if (orderResult.error) throw orderResult.error;

  const customer = customers.get(data.user_id);
  const name = customerName(customer);
  const email = customer?.email ?? data.user_id;
  const canRefund = data.status === "success" && data.refund_status === "none";
  const refundAmount =
    data.refund_amount === null || data.refund_currency === null
      ? null
      : formatMoney(data.refund_amount, data.refund_currency);

  return {
    id: data.transaction_ref,
    databaseId: data.id,
    checkoutSessionId: data.checkout_session_id,
    customerName: name,
    customerEmail: email,
    date: formatDate(data.created_at),
    dateIso: data.created_at,
    amount: formatMoney(data.amount, data.currency),
    amountValue: Number(data.amount),
    currency: data.currency,
    method: mapProviderName(data.provider),
    paymentProvider: data.provider,
    status: data.status,
    canRefund,
    refundBlockedReason: canRefund ? undefined : "Refund flow is not wired yet or transaction is not successful.",
    providerPaymentId: data.provider_payment_id,
    providerSessionId: data.provider_session_id,
    orderId: orderResult.data?.id ?? null,
    orderReference: orderResult.data?.order_ref ?? null,
    orderStatus: orderResult.data?.status ?? null,
    refundStatus: data.refund_status,
    refundedAt: data.refunded_at ? formatDate(data.refunded_at) : null,
    providerRefundId: data.provider_refund_id,
    refundAmount,
    rawProviderPayload: data.raw_provider_payload ?? {},
    updatedAt: formatDate(data.updated_at),
  } satisfies AdminTransactionDetail;
}
