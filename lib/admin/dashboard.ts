import { listAdminOrders } from "@/lib/admin/orders";
import { listAdminTransactions } from "@/lib/admin/transactions";
import { createAdminClient } from "@/lib/supabase/admin";
import { listAdminTickets } from "@/lib/chat";

type Currency = "USD" | "EUR";

type TopServiceRow = {
  id: string;
  service_id: string;
  total: number | string;
  currency: Currency;
  created_at: string;
  orders: { status: string } | { status: string }[] | null;
  services:
    | {
        title: string;
        image: string | null;
        service_categories: { name: string } | { name: string }[] | null;
      }
    | {
        title: string;
        image: string | null;
        service_categories: { name: string } | { name: string }[] | null;
      }[]
    | null;
};

export type AdminDashboardPeriodDays = 1 | 7 | 14 | 30 | 90 | 180;

function relationOne<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatMoney(value: number, currency: Currency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMoneyParts(totals: Record<Currency, number>) {
  const parts = [];
  if (totals.USD > 0) parts.push(formatMoney(totals.USD, "USD"));
  if (totals.EUR > 0) parts.push(formatMoney(totals.EUR, "EUR"));
  return parts.join(" / ") || "$0";
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function daysAgo(days: number) {
  const date = startOfDay(new Date());
  date.setDate(date.getDate() - days);
  return date;
}

function periodStart(days: AdminDashboardPeriodDays) {
  return daysAgo(days - 1);
}

function shortDayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" }).format(date);
}

function shortTimeLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

function bucketLabel(start: Date, end: Date) {
  const sameDay = start.toISOString().slice(0, 10) === end.toISOString().slice(0, 10);
  if (sameDay) return shortDayLabel(start);
  return `${shortDayLabel(start)}-${shortDayLabel(end)}`;
}

async function countAuthUsers(since: Date) {
  const supabase = createAdminClient();
  let page = 1;
  let total = 0;
  let newInPeriod = 0;

  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    total += data.users.length;
    newInPeriod += data.users.filter((user) => new Date(user.created_at) >= since).length;
    if (data.users.length < 1000) break;
    page += 1;
  }

  return { total, newInPeriod };
}

async function getTopServices(sinceIso: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("order_items")
    .select("id, service_id, total, currency, created_at, orders!inner(status), services(title, image, service_categories(name))")
    .gte("created_at", sinceIso)
    .neq("orders.status", "refunded")
    .returns<TopServiceRow[]>();

  if (error) throw error;

  const grouped = new Map<string, { name: string; image: string | null; category: string; count: number; totals: Record<Currency, number> }>();

  for (const row of data ?? []) {
    const service = relationOne(row.services);
    const category = relationOne(service?.service_categories);
    const name = service?.title ?? "Service";
    const current = grouped.get(row.service_id) ?? {
      name,
      image: service?.image ?? null,
      category: category?.name ?? "Service",
      count: 0,
      totals: { USD: 0, EUR: 0 },
    };

    current.count += 1;
    current.totals[row.currency] += Number(row.total);
    grouped.set(row.service_id, current);
  }

  return [...grouped.values()]
    .sort((a, b) => b.totals.USD + b.totals.EUR - (a.totals.USD + a.totals.EUR))
    .slice(0, 4)
    .map((service) => ({
      ...service,
      revenue: formatMoneyParts(service.totals),
    }));
}

function buildOrderPulse({
  days,
  orders,
  transactions,
}: {
  days: AdminDashboardPeriodDays;
  orders: Array<{ createdAtIso: string }>;
  transactions: Array<{ dateIso: string; status: string; amountValue: number; currency: Currency }>;
}) {
  const since = periodStart(days);

  if (days === 1) {
    const bucketCount = 8;
    const bucketSizeHours = 24 / bucketCount;
    const buckets = Array.from({ length: bucketCount }, (_, index) => {
      const start = new Date(since);
      start.setHours(index * bucketSizeHours, 0, 0, 0);
      const end = new Date(start);
      end.setHours(start.getHours() + bucketSizeHours, 0, 0, -1);

      return {
        key: start.toISOString(),
        label: shortTimeLabel(start),
        start,
        end,
        orders: 0,
        revenueUsd: 0,
        revenueEur: 0,
      };
    });

    for (const order of orders) {
      const createdAt = new Date(order.createdAtIso);
      const bucket = buckets.find((item) => createdAt >= item.start && createdAt <= item.end);
      if (bucket) bucket.orders += 1;
    }

    for (const transaction of transactions) {
      if (transaction.status !== "success") continue;
      const createdAt = new Date(transaction.dateIso);
      const bucket = buckets.find((item) => createdAt >= item.start && createdAt <= item.end);
      if (bucket) {
        if ("currency" in transaction && transaction.currency === "EUR") bucket.revenueEur += transaction.amountValue;
        else bucket.revenueUsd += transaction.amountValue;
      }
    }

    return buckets.map(({ start, end, ...bucket }) => bucket);
  }

  const bucketCount = days <= 14 ? days : days <= 30 ? 10 : 12;
  const bucketSizeDays = Math.ceil(days / bucketCount);
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const start = new Date(since);
    start.setDate(since.getDate() + index * bucketSizeDays);
    const end = new Date(start);
    end.setDate(start.getDate() + bucketSizeDays - 1);
    end.setHours(23, 59, 59, 999);

    return {
      key: start.toISOString(),
      label: bucketLabel(start, end),
      start,
      end,
      orders: 0,
      revenueUsd: 0,
      revenueEur: 0,
    };
  }).filter((bucket) => bucket.start <= new Date());

  for (const order of orders) {
    const createdAt = new Date(order.createdAtIso);
    const bucket = buckets.find((item) => createdAt >= item.start && createdAt <= item.end);
    if (bucket) bucket.orders += 1;
  }

  for (const transaction of transactions) {
    if (transaction.status !== "success") continue;
    const createdAt = new Date(transaction.dateIso);
    const bucket = buckets.find((item) => createdAt >= item.start && createdAt <= item.end);
    if (bucket) {
      if ("currency" in transaction && transaction.currency === "EUR") bucket.revenueEur += transaction.amountValue;
      else bucket.revenueUsd += transaction.amountValue;
    }
  }

  return buckets.map(({ start, end, ...bucket }) => bucket);
}

export async function getAdminDashboardData(days: AdminDashboardPeriodDays = 30) {
  const since = periodStart(days);
  const sinceIso = since.toISOString();

  const [orders, transactionResult, customerStats, tickets, topServices] = await Promise.all([
    listAdminOrders(),
    listAdminTransactions(),
    countAuthUsers(since),
    listAdminTickets(),
    getTopServices(sinceIso),
  ]);

  const recentOrders = orders.filter((order) => new Date(order.createdAtIso) >= since);
  const recentTransactions = transactionResult.records.filter((transaction) => new Date(transaction.dateIso) >= since);
  const successfulTransactions = recentTransactions.filter((transaction) => transaction.status === "success");
  const revenueTotals = successfulTransactions.reduce(
    (sum, transaction) => {
      sum[transaction.currency] += transaction.amountValue;
      return sum;
    },
    { USD: 0, EUR: 0 } as Record<Currency, number>,
  );
  const refundRequests = orders.filter((order) => order.status === "refund_requested").length;
  const actionOrders = orders.filter((order) => ["pending", "delivered", "refund_requested"].includes(order.status)).length;
  const unreadChatTickets = tickets.filter((ticket) => ticket.unreadCount > 0).length;
  const chartDays = buildOrderPulse({ days, orders: recentOrders, transactions: recentTransactions });
  const maxOrderCount = Math.max(...chartDays.map((day) => day.orders), 1);
  const maxRevenueValue = Math.max(...chartDays.map((day) => Math.max(day.revenueUsd, day.revenueEur)), 1);

  return {
    period: {
      days,
      label: days === 1 ? "Today" : `Last ${days} days`,
    },
    stats: {
      revenue: formatMoneyParts(revenueTotals),
      activeCustomers: customerStats.total,
      newCustomers: customerStats.newInPeriod,
      completedOrders: recentOrders.filter((order) => order.status === "completed").length,
      refundRequests,
      actionOrders,
      unreadChatTickets,
    },
    chartDays,
    maxOrderCount,
    maxRevenueValue,
    topServices,
    recentOrders: recentOrders.slice(0, 5),
    recentTransactions: recentTransactions.slice(0, 5),
  };
}

export type AdminDashboardData = Awaited<ReturnType<typeof getAdminDashboardData>>;
