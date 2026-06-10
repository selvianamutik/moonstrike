import type { AdminOrderStatus } from "@/lib/admin-constants";
import { autoCompleteDeliveredOrders, type OrderOptionSnapshot, type OrderOptionValue } from "@/lib/orders";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminCustomer = { email?: string; user_metadata?: Record<string, unknown> } | null;

type ServiceRelation =
  | {
      title: string;
      image: string | null;
      games: { name: string } | { name: string }[] | null;
      service_categories: { name: string } | { name: string }[] | null;
    }
  | {
      title: string;
      image: string | null;
      games: { name: string } | { name: string }[] | null;
      service_categories: { name: string } | { name: string }[] | null;
    }[]
  | null;

type AdminOrderItemRow = {
  id: string;
  service_id: string;
  selected_options_snapshot: OrderOptionSnapshot;
  total: number | string;
  currency: "USD" | "EUR";
  services: ServiceRelation;
};

type AdminOrderRow = {
  id: string;
  order_ref: string;
  user_id: string;
  checkout_session_id: string;
  status: AdminOrderStatus;
  refund_previous_status: AdminOrderStatus | null;
  created_at: string;
  updated_at: string;
  order_items: AdminOrderItemRow[] | null;
};

type AdminOrderTransactionRow = {
  checkout_session_id: string;
  transaction_ref: string;
  provider: "stripe" | "nowpayments";
  provider_payment_id: string;
  amount: number | string;
  currency: "USD" | "EUR";
  status: string;
  refund_status: string;
};

export type AdminOrderItemRecord = {
  id: string;
  serviceName: string;
  serviceImage: string | null;
  gameName: string;
  categoryName: string;
  amount: string;
  total: number;
  currency: "USD" | "EUR";
  selectedOptions: Array<{ group: string; value: string; priceModifier: number }>;
  optionsSummary: string;
};

export type AdminOrderRecord = {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  serviceImage: string | null;
  gameName: string;
  categoryName: string;
  optionsSummary: string;
  createdAt: string;
  createdAtIso: string;
  updatedAt: string;
  amount: string;
  total: number;
  currency: "USD" | "EUR";
  status: AdminOrderStatus;
  paymentProvider: "stripe" | "nowpayments";
  transactionId: string;
  checkoutSessionId: string;
  orderReference: string;
  cryptoRefundAddress?: string;
  itemCount: number;
  selectedOptions: Array<{ group: string; value: string; priceModifier: number }>;
  items: AdminOrderItemRecord[];
  timeline: Array<{ status: AdminOrderStatus; at: string; note?: string }>;
};

export type AdminOrderActionStatus = AdminOrderStatus | "deny_refund";

export function getNextOrderActions(status: AdminOrderStatus): Array<{ label: string; variant: "primary" | "danger" | "secondary"; next?: AdminOrderActionStatus }> {
  switch (status) {
    case "pending":
      return [{ label: "Confirm Order", variant: "primary", next: "confirmed" }];
    case "confirmed":
      return [{ label: "Mark as In Progress", variant: "primary", next: "in_progress" }];
    case "in_progress":
      return [{ label: "Mark as Delivered", variant: "primary", next: "delivered" }];
    case "delivered":
      return [{ label: "Mark as Completed", variant: "primary", next: "completed" }];
    case "refund_requested":
      return [
        { label: "Approve Refund", variant: "danger", next: "refunded" },
        { label: "Deny Refund", variant: "secondary", next: "deny_refund" },
      ];
    default:
      return [];
  }
}

function relationOne<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
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

function formatOptionValue(value: OrderOptionValue) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function customerName(user: AdminCustomer | undefined) {
  const metadata = user?.user_metadata ?? {};
  const displayName = metadata.username ?? metadata.full_name ?? metadata.name;
  return typeof displayName === "string" && displayName.trim() ? displayName.trim() : user?.email ?? "Customer";
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

function selectedOptionsFromSnapshot(snapshot: OrderOptionSnapshot, currency: "USD" | "EUR") {
  return Object.entries(snapshot ?? {}).map(([group, option]) => ({
    group,
    value: formatOptionValue(option.value),
    priceModifier: currency === "EUR" ? option.priceEUR ?? 0 : option.priceUSD ?? 0,
  }));
}

function mapItem(row: AdminOrderItemRow): AdminOrderItemRecord {
  const service = relationOne(row.services);
  const game = relationOne(service?.games);
  const category = relationOne(service?.service_categories);
  const selectedOptions = selectedOptionsFromSnapshot(row.selected_options_snapshot, row.currency);

  return {
    id: row.id,
    serviceName: service?.title ?? "Service",
    serviceImage: service?.image ?? null,
    gameName: game?.name ?? "Game",
    categoryName: category?.name ?? "Service",
    amount: formatMoney(row.total, row.currency),
    total: Number(row.total),
    currency: row.currency,
    selectedOptions,
    optionsSummary: selectedOptions.length > 0 ? selectedOptions.map((option) => `${option.group}: ${option.value}`).join(" / ") : "No selected options",
  };
}

function mapOrder(row: AdminOrderRow, user: AdminCustomer | undefined, transaction?: AdminOrderTransactionRow): AdminOrderRecord {
  const items = row.order_items?.map(mapItem) ?? [];
  const currency = transaction?.currency ?? items[0]?.currency ?? "USD";
  const total = transaction ? Number(transaction.amount) : items.reduce((sum, item) => sum + item.total, 0);
  const selectedOptions = items.length === 1 ? items[0].selectedOptions : [];
  const transactionId = transaction?.transaction_ref ?? row.checkout_session_id;
  const serviceName = items.length === 1 ? items[0].serviceName : `${items.length} services`;
  const gameName = items.length === 1 ? items[0].gameName : Array.from(new Set(items.map((item) => item.gameName))).join(", ");
  const optionsSummary = items.length === 1 ? items[0].optionsSummary : items.map((item) => `${item.serviceName}: ${item.optionsSummary}`).join(" / ");

  return {
    id: row.id,
    userId: row.user_id,
    customerName: customerName(user),
    customerEmail: user?.email ?? row.user_id,
    serviceName,
    serviceImage: items[0]?.serviceImage ?? null,
    gameName,
    categoryName: items.length === 1 ? items[0].categoryName : "Multiple services",
    optionsSummary,
    createdAt: formatDate(row.created_at),
    createdAtIso: row.created_at,
    updatedAt: formatDate(row.updated_at),
    amount: formatMoney(total, currency),
    total,
    currency,
    status: row.status,
    paymentProvider: transaction?.provider ?? "stripe",
    transactionId,
    checkoutSessionId: row.checkout_session_id,
    orderReference: row.order_ref,
    cryptoRefundAddress: undefined,
    itemCount: items.length,
    selectedOptions,
    items,
    timeline: [
      { status: "pending", at: formatDate(row.created_at), note: "Order created after checkout." },
      ...(row.status !== "pending" ? [{ status: row.status, at: formatDate(row.updated_at) }] : []),
    ],
  };
}

const orderSelect =
  "id, order_ref, user_id, checkout_session_id, status, refund_previous_status, created_at, updated_at, order_items(id, service_id, selected_options_snapshot, total, currency, services(title, image, games(name), service_categories(name)))";

async function getTransactionsByCheckoutSession(checkoutSessionIds: string[]) {
  if (checkoutSessionIds.length === 0) return new Map<string, AdminOrderTransactionRow>();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("checkout_session_id, transaction_ref, provider, provider_payment_id, amount, currency, status, refund_status")
    .in("checkout_session_id", checkoutSessionIds)
    .returns<AdminOrderTransactionRow[]>();

  if (error) throw error;
  return new Map((data ?? []).map((transaction) => [transaction.checkout_session_id, transaction]));
}

export async function listAdminOrders() {
  await autoCompleteDeliveredOrders();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(orderSelect)
    .order("created_at", { ascending: false })
    .returns<AdminOrderRow[]>();

  if (error) throw error;

  const customers = await getCustomersById((data ?? []).map((order) => order.user_id));
  const transactions = await getTransactionsByCheckoutSession((data ?? []).map((order) => order.checkout_session_id));
  return (data ?? []).map((order) => mapOrder(order, customers.get(order.user_id), transactions.get(order.checkout_session_id)));
}

export async function getAdminOrder(id: string) {
  await autoCompleteDeliveredOrders();

  const supabase = createAdminClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  const query = supabase
    .from("orders")
    .select(orderSelect)
    .limit(1);

  const { data, error } = await (isUuid ? query.eq("id", id) : query.eq("order_ref", id)).maybeSingle<AdminOrderRow>();

  if (error) throw error;
  if (!data) return null;

  const customers = await getCustomersById([data.user_id]);
  const transactions = await getTransactionsByCheckoutSession([data.checkout_session_id]);
  return mapOrder(data, customers.get(data.user_id), transactions.get(data.checkout_session_id));
}
