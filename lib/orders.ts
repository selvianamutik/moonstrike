import { createAdminClient } from "@/lib/supabase/admin";

export type OrderCurrency = "USD" | "EUR";
export type OrderOptionValue = string | number | boolean | string[];
export type OrderOptionSnapshot = Record<
  string,
  {
    value: OrderOptionValue;
    priceUSD?: number;
    priceEUR?: number;
  }
>;

type ServiceRelation =
  | {
      title: string;
      image: string | null;
      description: string | null;
      games: { name: string } | { name: string }[] | null;
      service_categories: { name: string } | { name: string }[] | null;
    }
  | {
      title: string;
      image: string | null;
      description: string | null;
      games: { name: string } | { name: string }[] | null;
      service_categories: { name: string } | { name: string }[] | null;
    }[]
  | null;

type CustomerOrderItemRow = {
  id: string;
  service_id: string;
  selected_options_snapshot: OrderOptionSnapshot;
  total: number | string;
  currency: OrderCurrency;
  services: ServiceRelation;
};

export type CustomerOrderRow = {
  id: string;
  order_ref: string;
  checkout_session_id: string;
  status: string;
  refund_previous_status: string | null;
  completed_at: string | null;
  created_at: string;
  order_items: CustomerOrderItemRow[] | null;
};

type CustomerOrderTransactionRow = {
  checkout_session_id: string;
  transaction_ref: string;
  provider: string;
  provider_payment_id: string;
  amount: number | string;
  currency: OrderCurrency;
  status: string;
};

export type CustomerOrderItem = {
  id: string;
  selectedOptionsSnapshot: OrderOptionSnapshot;
  total: number;
  currency: OrderCurrency;
  service: {
    id: string;
    title: string;
    image: string | null;
    description: string;
    gameName: string;
    categoryName: string;
  };
};

export type CustomerOrder = {
  id: string;
  checkoutSessionId: string;
  orderReference: string;
  selectedOptionsSnapshot: OrderOptionSnapshot;
  total: number;
  currency: OrderCurrency;
  paymentProvider: string;
  transactionId: string;
  paymentStatus: string;
  status: string;
  completedAt: string | null;
  createdAt: string;
  itemCount: number;
  serviceSummary: string;
  primaryImage: string | null;
  items: CustomerOrderItem[];
};

function relationOne<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function mapItem(row: CustomerOrderItemRow): CustomerOrderItem {
  const service = relationOne(row.services);
  const game = relationOne(service?.games);
  const category = relationOne(service?.service_categories);

  return {
    id: row.id,
    selectedOptionsSnapshot: row.selected_options_snapshot ?? {},
    total: Number(row.total),
    currency: row.currency,
    service: {
      id: row.service_id,
      title: service?.title ?? "Service",
      image: service?.image ?? null,
      description: service?.description ?? "",
      gameName: game?.name ?? "Game",
      categoryName: category?.name ?? "Service",
    },
  };
}

function mapOrder(row: CustomerOrderRow, transaction?: CustomerOrderTransactionRow): CustomerOrder {
  const items = row.order_items?.map(mapItem) ?? [];
  const serviceSummary = items.length === 1 ? items[0].service.title : `${items.length} services`;
  const fallbackCurrency = items[0]?.currency ?? "USD";
  const fallbackTotal = items.reduce((sum, item) => sum + item.total, 0);
  const currency = transaction?.currency ?? fallbackCurrency;
  const total = transaction ? Number(transaction.amount) : fallbackTotal;

  return {
    id: row.id,
    checkoutSessionId: row.checkout_session_id,
    orderReference: row.order_ref,
    selectedOptionsSnapshot: {},
    total,
    currency,
    paymentProvider: transaction?.provider ?? "unknown",
    transactionId: transaction?.transaction_ref ?? row.checkout_session_id,
    paymentStatus: transaction?.status ?? "pending",
    status: row.status,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    itemCount: items.length,
    serviceSummary,
    primaryImage: items[0]?.service.image ?? null,
    items,
  };
}

const orderSelect =
  "id, order_ref, checkout_session_id, status, refund_previous_status, completed_at, created_at, order_items(id, service_id, selected_options_snapshot, total, currency, services(title, image, description, games(name), service_categories(name)))";

const REFUND_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function canRequestOrderRefund(status: string, completedAt?: string | null, now = new Date()) {
  if (["refund_requested", "refunded"].includes(status)) return false;
  if (status !== "completed") return true;
  if (!completedAt) return false;

  const completedTime = new Date(completedAt).getTime();
  if (Number.isNaN(completedTime)) return false;

  return now.getTime() - completedTime <= REFUND_WINDOW_MS;
}

async function getTransactionsByCheckoutSession(userId: string, checkoutSessionIds: string[]) {
  if (checkoutSessionIds.length === 0) return new Map<string, CustomerOrderTransactionRow>();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("checkout_session_id, transaction_ref, provider, provider_payment_id, amount, currency, status")
    .eq("user_id", userId)
    .in("checkout_session_id", checkoutSessionIds)
    .returns<CustomerOrderTransactionRow[]>();

  if (error) throw error;
  return new Map((data ?? []).map((transaction) => [transaction.checkout_session_id, transaction]));
}

export async function listCustomerOrders(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(orderSelect)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<CustomerOrderRow[]>();

  if (error) throw error;
  const rows = data ?? [];
  const transactions = await getTransactionsByCheckoutSession(userId, rows.map((order) => order.checkout_session_id));
  return rows.map((order) => mapOrder(order, transactions.get(order.checkout_session_id)));
}

export async function getCustomerOrder(userId: string, orderId: string) {
  const supabase = createAdminClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId);
  const query = supabase
    .from("orders")
    .select(orderSelect)
    .eq("user_id", userId);

  const { data, error } = await (isUuid ? query.eq("id", orderId) : query.eq("order_ref", orderId)).maybeSingle<CustomerOrderRow>();

  if (error) throw error;
  if (!data) return null;

  const transactions = await getTransactionsByCheckoutSession(userId, [data.checkout_session_id]);
  return mapOrder(data, transactions.get(data.checkout_session_id));
}

export async function getCustomerOrderByCheckoutSession(userId: string, checkoutSessionId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(orderSelect)
    .eq("user_id", userId)
    .eq("checkout_session_id", checkoutSessionId)
    .maybeSingle<CustomerOrderRow>();

  if (error) throw error;
  if (!data) return null;

  const transactions = await getTransactionsByCheckoutSession(userId, [data.checkout_session_id]);
  return mapOrder(data, transactions.get(data.checkout_session_id));
}

export function formatOrderMoney(value: number, currency: OrderCurrency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatOrderDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatPaymentProvider(value: string) {
  if (value === "stripe") return "Stripe";
  if (value === "nowpayments") return "NOWPayments";
  if (value === "lemonsqueezy") return "Lemon Squeezy";
  if (value === "polar") return "Polar";
  if (value === "paddle") return "Paddle";
  return value === "unknown" ? "Pending" : value;
}

export function formatOrderOptionValue(value: OrderOptionValue) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}
