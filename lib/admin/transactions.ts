import { createAdminClient } from "@/lib/supabase/admin";

type AdminCustomer = { email?: string; user_metadata?: Record<string, unknown> } | null;

type TransactionRow = {
  id: string;
  checkout_session_id: string;
  user_id: string;
  provider: "stripe" | "nowpayments";
  provider_payment_id: string;
  provider_session_id: string | null;
  amount: number | string;
  currency: "USD" | "EUR";
  method: string;
  status: "success" | "pending" | "disputed" | "refunded" | "failed";
  refund_status: string;
  created_at: string;
};

type OrderForTransactionRow = {
  checkout_session_id: string;
  order_items:
    | {
        services: { title: string } | { title: string }[] | null;
      }[]
    | null;
  services:
    | { title: string }
    | { title: string }[]
    | null;
};

export type AdminTransactionRecord = {
  id: string;
  checkoutSessionId: string;
  customerName: string;
  customerEmail: string;
  customerInitials: string;
  services: string[];
  date: string;
  amount: string;
  method: string;
  paymentProvider: "stripe" | "nowpayments";
  status: TransactionRow["status"];
  canRefund: boolean;
  refundBlockedReason?: string;
};

export type AdminTransactionStats = {
  totalRevenue: string;
  pendingPayouts: string;
  successRate: string;
  newDisputes: number;
};

function relationOne<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function customerName(user: AdminCustomer | undefined) {
  const metadata = user?.user_metadata ?? {};
  const displayName = metadata.username ?? metadata.full_name ?? metadata.name;
  return typeof displayName === "string" && displayName.trim() ? displayName.trim() : user?.email ?? "Customer";
}

function initials(name: string, email: string) {
  const source = name !== "Customer" ? name : email;
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CU";
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
    .select("id, checkout_session_id, user_id, provider, provider_payment_id, provider_session_id, amount, currency, method, status, refund_status, created_at")
    .order("created_at", { ascending: false })
    .returns<TransactionRow[]>();

  if (error) throw error;

  const rows = transactions ?? [];
  const customers = await getCustomersById(rows.map((transaction) => transaction.user_id));
  const checkoutIds = rows.map((transaction) => transaction.checkout_session_id);
  const serviceNamesByCheckout = new Map<string, string[]>();

  if (checkoutIds.length > 0) {
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("checkout_session_id, services(title), order_items(services(title))")
      .in("checkout_session_id", checkoutIds)
      .returns<OrderForTransactionRow[]>();

    if (ordersError) throw ordersError;

    for (const order of orders ?? []) {
      const itemNames =
        order.order_items
          ?.map((item) => relationOne(item.services)?.title)
          .filter((name): name is string => Boolean(name)) ?? [];
      const legacyService = relationOne(order.services);
      const names = itemNames.length > 0 ? itemNames : [legacyService?.title ?? "Service"];
      const current = serviceNamesByCheckout.get(order.checkout_session_id) ?? [];
      serviceNamesByCheckout.set(order.checkout_session_id, [...current, ...names]);
    }
  }

  const records = rows.map((transaction) => {
    const customer = customers.get(transaction.user_id);
    const name = customerName(customer);
    const email = customer?.email ?? transaction.user_id;
    const canRefund = transaction.status === "success" && transaction.refund_status === "none";

    return {
      id: transaction.provider_payment_id,
      checkoutSessionId: transaction.checkout_session_id,
      customerName: name,
      customerEmail: email,
      customerInitials: initials(name, email),
      services: serviceNamesByCheckout.get(transaction.checkout_session_id) ?? ["Checkout"],
      date: formatDate(transaction.created_at),
      amount: formatMoney(transaction.amount, transaction.currency),
      method: transaction.method,
      paymentProvider: transaction.provider,
      status: transaction.status,
      canRefund,
      refundBlockedReason: canRefund ? undefined : "Refund flow is not wired yet or transaction is not successful.",
    } satisfies AdminTransactionRecord;
  });

  const successCount = rows.filter((transaction) => transaction.status === "success").length;
  const totalCount = rows.length || 1;
  const totals = rows.reduce(
    (sum, transaction) => {
      if (transaction.status === "success") sum[transaction.currency] += Number(transaction.amount);
      return sum;
    },
    { USD: 0, EUR: 0 },
  );
  const revenueParts = [];
  if (totals.USD > 0) revenueParts.push(formatMoney(totals.USD, "USD"));
  if (totals.EUR > 0) revenueParts.push(formatMoney(totals.EUR, "EUR"));

  return {
    records,
    stats: {
      totalRevenue: revenueParts.join(" / ") || "$0.00",
      pendingPayouts: "$0.00",
      successRate: `${((successCount / totalCount) * 100).toFixed(1)}%`,
      newDisputes: rows.filter((transaction) => transaction.status === "disputed").length,
    } satisfies AdminTransactionStats,
  };
}
