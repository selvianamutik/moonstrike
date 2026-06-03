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
  region: string;
  services: ServiceRelation;
};

export type CustomerOrderRow = {
  id: string;
  checkout_session_id: string;
  selected_options_snapshot: OrderOptionSnapshot;
  total: number | string;
  currency: OrderCurrency;
  region: string;
  payment_provider: string;
  stripe_payment_intent_id: string | null;
  nowpayments_payment_id: string | null;
  status: string;
  refund_previous_status: string | null;
  created_at: string;
  order_items: CustomerOrderItemRow[] | null;
  services: ServiceRelation;
  service_id: string | null;
};

export type CustomerOrderItem = {
  id: string;
  selectedOptionsSnapshot: OrderOptionSnapshot;
  total: number;
  currency: OrderCurrency;
  region: string;
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
  region: string;
  paymentProvider: string;
  transactionId: string;
  paymentStatus: string;
  status: string;
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
    region: row.region,
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

function legacyItemFromOrder(row: CustomerOrderRow): CustomerOrderItem {
  const service = relationOne(row.services);
  const game = relationOne(service?.games);
  const category = relationOne(service?.service_categories);

  return {
    id: row.id,
    selectedOptionsSnapshot: row.selected_options_snapshot ?? {},
    total: Number(row.total),
    currency: row.currency,
    region: row.region,
    service: {
      id: row.service_id ?? "",
      title: service?.title ?? "Service",
      image: service?.image ?? null,
      description: service?.description ?? "",
      gameName: game?.name ?? "Game",
      categoryName: category?.name ?? "Service",
    },
  };
}

function mapOrder(row: CustomerOrderRow): CustomerOrder {
  const items = row.order_items?.length ? row.order_items.map(mapItem) : [legacyItemFromOrder(row)];
  const serviceSummary = items.length === 1 ? items[0].service.title : `${items.length} services`;

  return {
    id: row.id,
    checkoutSessionId: row.checkout_session_id,
    orderReference: row.checkout_session_id,
    selectedOptionsSnapshot: row.selected_options_snapshot ?? {},
    total: Number(row.total),
    currency: row.currency,
    region: row.region,
    paymentProvider: row.payment_provider,
    transactionId: row.stripe_payment_intent_id ?? row.nowpayments_payment_id ?? row.checkout_session_id,
    paymentStatus: row.payment_provider === "stripe" && row.stripe_payment_intent_id?.startsWith("test_") ? "test_pending" : "paid",
    status: row.status,
    createdAt: row.created_at,
    itemCount: items.length,
    serviceSummary,
    primaryImage: items[0]?.service.image ?? null,
    items,
  };
}

const orderSelect =
  "id, service_id, checkout_session_id, selected_options_snapshot, total, currency, region, payment_provider, stripe_payment_intent_id, nowpayments_payment_id, status, refund_previous_status, created_at, services(title, image, description, games(name), service_categories(name)), order_items(id, service_id, selected_options_snapshot, total, currency, region, services(title, image, description, games(name), service_categories(name)))";

export async function listCustomerOrders(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(orderSelect)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<CustomerOrderRow[]>();

  if (error) throw error;
  return (data ?? []).map(mapOrder);
}

export async function getCustomerOrder(userId: string, orderId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(orderSelect)
    .eq("user_id", userId)
    .eq("id", orderId)
    .maybeSingle<CustomerOrderRow>();

  if (error) throw error;
  return data ? mapOrder(data) : null;
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
  return data ? mapOrder(data) : null;
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

export function formatOrderOptionValue(value: OrderOptionValue) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}
