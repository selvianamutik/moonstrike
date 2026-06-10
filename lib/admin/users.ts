import type { User } from "@supabase/supabase-js";
import { isBanActive } from "@/lib/auth/ban";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminCustomerStatus = "active" | "banned";

export type AdminCustomerRecord = {
  id: string;
  slug: string;
  name: string;
  email: string;
  avatarInitials: string;
  status: AdminCustomerStatus;
  emailVerified: boolean;
  provider: string;
  createdAt: string;
  lastSignIn: string;
  orderCount: number;
  activeOrderCount: number;
  pendingRefundCount: number;
  totalSpent: string;
};

export type AdminCustomerStats = {
  totalUsers: number;
  verifiedUsers: number;
  newThisMonth: number;
  bannedUsers: number;
};

export type AdminCustomerRecentOrder = {
  id: string;
  orderRef: string;
  status: string;
  createdAt: string;
  itemCount: number;
  total: string;
};

export type AdminCustomerRecentTransaction = {
  id: string;
  provider: string;
  amount: string;
  status: string;
  refundStatus: string;
  createdAt: string;
};

export type AdminCustomerEvent = {
  id: string;
  eventType: string;
  action: string;
  status: "success" | "critical" | "blocked";
  timestamp: string;
};

export type AdminCustomerModerationEvent = {
  id: string;
  action: "banned" | "unbanned";
  reason: string;
  adminLabel: string;
  createdAt: string;
};

export type AdminCustomerTimelineEvent = {
  id: string;
  type: "order" | "transaction" | "moderation";
  title: string;
  description: string;
  timestamp: string;
  status: string;
  href?: string;
};

export type AdminCustomerDetail = AdminCustomerRecord & {
  rawCreatedAt: string;
  rawLastSignIn: string | null;
  providers: string[];
  orderSummary: {
    completedOrders: number;
    refundedOrders: number;
    refundRequests: number;
    rejectedRefunds: number;
    totalRefunded: string;
  };
  recentOrders: AdminCustomerRecentOrder[];
  recentTransactions: AdminCustomerRecentTransaction[];
  riskSummary: {
    blockedEvents: number;
    criticalEvents: number;
    refundRequestRate: string;
  };
  recentEvents: AdminCustomerEvent[];
  moderationEvents: AdminCustomerModerationEvent[];
  activityTimeline: AdminCustomerTimelineEvent[];
};

type OrderRow = {
  id: string;
  user_id: string;
  order_ref: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  order_items?: Array<{
    total: number | string;
    currency: "USD" | "EUR" | string;
  }> | null;
};

type TransactionRow = {
  id?: string;
  transaction_ref?: string | null;
  provider?: string;
  user_id: string;
  amount: number | string;
  currency: "USD" | "EUR" | string;
  status: string;
  refund_status?: string | null;
  refund_amount?: number | string | null;
  refund_currency?: "USD" | "EUR" | string | null;
  created_at?: string;
};

type AuditLogRow = {
  id: string;
  event_type: string;
  actor_label: string;
  action: string;
  status: "success" | "critical" | "blocked";
  timestamp: string;
};

type ModerationEventRow = {
  id: string;
  action: "banned" | "unbanned";
  reason: string;
  created_at: string;
  admin_users: { display_name: string; email: string } | { display_name: string; email: string }[] | null;
};

const activeOrderStatuses = new Set(["pending", "confirmed", "in_progress", "delivered"]);

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(value: string | null | undefined) {
  if (!value) return "Never";
  return dateFormatter.format(new Date(value));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Never";
  return dateTimeFormatter.format(new Date(value));
}

function formatMoney(value: number | string, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value));
}

function getUserName(user: User) {
  const metadata = user.user_metadata ?? {};
  const name = metadata.username ?? metadata.full_name ?? metadata.name ?? metadata.display_name;
  if (typeof name === "string" && name.trim()) return name.trim();
  return user.email?.split("@")[0] ?? "Customer";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCustomerSlug(user: Pick<User, "email" | "user_metadata">) {
  const metadata = user.user_metadata ?? {};
  const username = metadata.username;
  const displayName = metadata.full_name ?? metadata.name;
  const source =
    (typeof username === "string" && username.trim()) ||
    (typeof displayName === "string" && displayName.trim()) ||
    user.email?.split("@")[0] ||
    "customer";

  return slugify(String(source)) || "customer";
}

function getCustomerSlugAliases(user: Pick<User, "email" | "user_metadata">) {
  const metadata = user.user_metadata ?? {};
  const values = [
    getCustomerSlug(user),
    typeof metadata.username === "string" ? metadata.username : "",
    typeof metadata.full_name === "string" ? metadata.full_name : "",
    typeof metadata.name === "string" ? metadata.name : "",
    user.email?.split("@")[0] ?? "",
    user.email ?? "",
  ];

  return new Set(values.map((value) => slugify(value)).filter(Boolean));
}

function getInitials(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  const source = parts[0] ?? email;
  return source.slice(0, 2).toUpperCase();
}

function getProviders(user: User) {
  const appMetadata = user.app_metadata ?? {};
  const providers = appMetadata.providers;
  if (Array.isArray(providers) && providers.length > 0) {
    return providers.map((provider) => String(provider));
  }

  if (typeof appMetadata.provider === "string" && appMetadata.provider) {
    return [appMetadata.provider];
  }

  return ["email"];
}

function getStatus(user: User): AdminCustomerStatus {
  if (isBanActive(user.banned_until)) return "banned";
  return "active";
}

function formatProvider(providers: string[]) {
  return providers.map((provider) => provider[0]?.toUpperCase() + provider.slice(1)).join(", ");
}

function formatMoneyTotals(amounts: Map<string, number>) {
  if (amounts.size === 0) return "$0.00";

  return Array.from(amounts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, amount]) =>
      new Intl.NumberFormat("en", {
        style: "currency",
        currency,
      }).format(amount),
    )
    .join(" / ");
}

function relationOne<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildCustomerRecord(user: User, orders: OrderRow[], transactions: TransactionRow[]): AdminCustomerRecord {
  const email = user.email ?? "No email";
  const name = getUserName(user);
  const providers = getProviders(user);
  const orderCount = orders.length;
  const activeOrderCount = orders.filter((order) => activeOrderStatuses.has(order.status)).length;
  const pendingRefundCount = orders.filter((order) => order.status === "refund_requested").length;
  const totals = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.status !== "success") continue;
    const currency = transaction.currency || "USD";
    const amount = Number(transaction.amount) || 0;
    totals.set(currency, (totals.get(currency) ?? 0) + amount);
  }

  return {
    id: user.id,
    slug: getCustomerSlug(user),
    name,
    email,
    avatarInitials: getInitials(name, email),
    status: getStatus(user),
    emailVerified: Boolean(user.email_confirmed_at),
    provider: formatProvider(providers),
    createdAt: formatDate(user.created_at),
    lastSignIn: formatDateTime(user.last_sign_in_at),
    orderCount,
    activeOrderCount,
    pendingRefundCount,
    totalSpent: formatMoneyTotals(totals),
  };
}

async function getCustomerActivity(userIds: string[]) {
  if (userIds.length === 0) {
    return {
      orders: [] as OrderRow[],
      transactions: [] as TransactionRow[],
    };
  }

  const supabase = createAdminClient();
  const [ordersResult, transactionsResult] = await Promise.all([
    supabase
      .from("orders")
      .select("id,user_id,order_ref,status,created_at,updated_at,order_items(total,currency)")
      .in("user_id", userIds)
      .returns<OrderRow[]>(),
    supabase
      .from("transactions")
      .select("id,transaction_ref,user_id,provider,amount,currency,status,refund_status,refund_amount,refund_currency,created_at")
      .in("user_id", userIds)
      .returns<TransactionRow[]>(),
  ]);

  if (ordersResult.error) throw new Error(ordersResult.error.message);
  if (transactionsResult.error) throw new Error(transactionsResult.error.message);

  return {
    orders: ordersResult.data ?? [],
    transactions: transactionsResult.data ?? [],
  };
}

export async function listAdminCustomers() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) throw new Error(error.message);

  const users = data.users ?? [];
  const userIds = users.map((user) => user.id);
  const { orders, transactions } = await getCustomerActivity(userIds);

  const records = users
    .map((user) =>
      buildCustomerRecord(
        user,
        orders.filter((order) => order.user_id === user.id),
        transactions.filter((transaction) => transaction.user_id === user.id),
      ),
    )
    .sort((a, b) => a.email.localeCompare(b.email));

  const stats: AdminCustomerStats = {
    totalUsers: records.length,
    verifiedUsers: records.filter((record) => record.emailVerified).length,
    newThisMonth: users.filter((user) => {
      const createdAt = new Date(user.created_at);
      const now = new Date();
      return createdAt.getUTCFullYear() === now.getUTCFullYear() && createdAt.getUTCMonth() === now.getUTCMonth();
    }).length,
    bannedUsers: records.filter((record) => record.status === "banned").length,
  };

  return { customers: records, stats };
}

export async function getAdminCustomerById(id: string): Promise<AdminCustomerDetail | null> {
  const supabase = createAdminClient();
  let user: User | null = null;

  const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

  if (uuidLike) {
    const { data, error } = await supabase.auth.admin.getUserById(id);
    if (!error && data.user) user = data.user;
  }

  if (!user) {
    let page = 1;
    const normalizedId = slugify(id);

    while (page < 20 && !user) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error(error.message);

      user = data.users.find((candidate) => getCustomerSlugAliases(candidate).has(normalizedId)) ?? null;
      if (data.users.length < 1000) break;
      page += 1;
    }
  }

  if (!user) return null;

  const { orders, transactions } = await getCustomerActivity([user.id]);
  const record = buildCustomerRecord(user, orders, transactions);
  const providers = getProviders(user);
  const totalRefunded = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.refund_status !== "refunded" && transaction.status !== "refunded") continue;
    const currency = transaction.refund_currency ?? transaction.currency ?? "USD";
    const amount = Number(transaction.refund_amount ?? transaction.amount) || 0;
    totalRefunded.set(currency, (totalRefunded.get(currency) ?? 0) + amount);
  }

  const recentOrders = orders
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map((order) => ({
      id: order.id,
      orderRef: order.order_ref ?? order.id,
      status: order.status,
      createdAt: formatDateTime(order.created_at),
      itemCount: order.order_items?.length ?? 0,
      total: formatMoneyTotals(
        (order.order_items ?? []).reduce((totals, item) => {
          const currency = item.currency || "USD";
          totals.set(currency, (totals.get(currency) ?? 0) + Number(item.total));
          return totals;
        }, new Map<string, number>()),
      ),
    }));
  const recentTransactions = transactions
    .filter((transaction) => transaction.transaction_ref && transaction.created_at)
    .sort((a, b) => new Date(b.created_at ?? "").getTime() - new Date(a.created_at ?? "").getTime())
    .slice(0, 5)
    .map((transaction) => ({
      id: transaction.transaction_ref ?? transaction.id ?? "Transaction",
      provider: transaction.provider ?? "unknown",
      amount: formatMoney(transaction.amount, transaction.currency),
      status: transaction.status,
      refundStatus: transaction.refund_status ?? "none",
      createdAt: formatDateTime(transaction.created_at),
    }));
  const [auditResult, moderationResult] = await Promise.all([
    supabase
      .from("audit_logs")
      .select("id,event_type,actor_label,action,status,timestamp")
      .order("timestamp", { ascending: false })
      .limit(500)
      .returns<AuditLogRow[]>(),
    supabase
      .from("user_moderation_events")
      .select("id,action,reason,created_at,admin_users(display_name,email)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .returns<ModerationEventRow[]>(),
  ]);

  if (auditResult.error) throw new Error(auditResult.error.message);
  if (moderationResult.error) throw new Error(moderationResult.error.message);

  const email = user.email ?? "";
  const relatedEvents = (auditResult.data ?? [])
    .filter((event) => {
      const action = event.action.toLowerCase();
      return event.actor_label === email || action.includes(user.id.toLowerCase()) || (!!email && action.includes(email.toLowerCase()));
    })
    .slice(0, 5)
    .map((event) => ({
      id: event.id,
      eventType: event.event_type,
      action: event.action,
      status: event.status,
      timestamp: formatDateTime(event.timestamp),
    }));
  const moderationEvents = (moderationResult.data ?? []).map((event) => {
    const adminUser = relationOne(event.admin_users);

    return {
      id: event.id,
      action: event.action,
      reason: event.reason,
      adminLabel: adminUser?.display_name || adminUser?.email || "Admin",
      createdAt: formatDateTime(event.created_at),
    };
  });
  const activityTimeline = [
    ...orders.map((order) => ({
      id: `order-${order.id}`,
      type: "order" as const,
      title: `Order ${order.order_ref ?? order.id}`,
      description: `Order moved through ${order.status.replace(/_/g, " ")} status.`,
      timestamp: order.updated_at ?? order.created_at,
      status: order.status,
      href: `/admin/orders/${order.order_ref ?? order.id}`,
    })),
    ...transactions
      .filter((transaction) => transaction.transaction_ref && transaction.created_at)
      .map((transaction) => ({
        id: `transaction-${transaction.transaction_ref ?? transaction.id}`,
        type: "transaction" as const,
        title: `Transaction ${transaction.transaction_ref ?? transaction.id}`,
        description: `${transaction.provider ?? "Payment"} payment for ${formatMoney(transaction.amount, transaction.currency)}.`,
        timestamp: transaction.created_at ?? "",
        status: transaction.refund_status && transaction.refund_status !== "none" ? transaction.refund_status : transaction.status,
        href: transaction.transaction_ref ? `/admin/transactions/${transaction.transaction_ref}` : undefined,
      })),
    ...(moderationResult.data ?? []).map((event) => ({
      id: `moderation-${event.id}`,
      type: "moderation" as const,
      title: event.action === "banned" ? "Customer banned" : "Customer unbanned",
      description: event.reason || "Moderation status changed.",
      timestamp: event.created_at,
      status: event.action === "banned" ? "banned" : "active",
    })),
  ]
    .filter((event) => event.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)
    .map((event) => ({
      ...event,
      timestamp: formatDateTime(event.timestamp),
    }));
  const refundRequestCount = orders.filter((order) => order.status === "refund_requested").length;

  return {
    ...record,
    rawCreatedAt: user.created_at,
    rawLastSignIn: user.last_sign_in_at ?? null,
    providers,
    orderSummary: {
      completedOrders: orders.filter((order) => order.status === "completed").length,
      refundedOrders: orders.filter((order) => order.status === "refunded").length,
      refundRequests: refundRequestCount,
      rejectedRefunds: transactions.filter((transaction) => transaction.refund_status === "rejected").length,
      totalRefunded: formatMoneyTotals(totalRefunded),
    },
    recentOrders,
    recentTransactions,
    riskSummary: {
      blockedEvents: relatedEvents.filter((event) => event.status === "blocked").length,
      criticalEvents: relatedEvents.filter((event) => event.status === "critical").length,
      refundRequestRate: orders.length > 0 ? `${Math.round((refundRequestCount / orders.length) * 100)}%` : "0%",
    },
    recentEvents: relatedEvents,
    moderationEvents,
    activityTimeline,
  };
}
