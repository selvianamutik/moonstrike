import type { AdminOrderStatus } from "@/lib/admin-constants";
import type { OrderOptionSnapshot, OrderOptionValue } from "@/lib/orders";
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
  region: string;
  services: ServiceRelation;
};

type AdminOrderRow = {
  id: string;
  user_id: string;
  service_id: string | null;
  checkout_session_id: string;
  selected_options_snapshot: OrderOptionSnapshot;
  total: number | string;
  currency: "USD" | "EUR";
  region: string;
  payment_provider: "stripe" | "nowpayments";
  stripe_payment_intent_id: string | null;
  nowpayments_payment_id: string | null;
  crypto_refund_address: string | null;
  status: AdminOrderStatus;
  refund_previous_status: AdminOrderStatus | null;
  created_at: string;
  updated_at: string;
  order_items: AdminOrderItemRow[] | null;
  services: ServiceRelation;
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
  region: string;
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

function legacyItemFromOrder(row: AdminOrderRow): AdminOrderItemRecord {
  return mapItem({
    id: row.id,
    service_id: row.service_id ?? "",
    selected_options_snapshot: row.selected_options_snapshot ?? {},
    total: row.total,
    currency: row.currency,
    region: row.region,
    services: row.services,
  });
}

function mapOrder(row: AdminOrderRow, user: AdminCustomer | undefined): AdminOrderRecord {
  const items = row.order_items?.length ? row.order_items.map(mapItem) : [legacyItemFromOrder(row)];
  const selectedOptions = selectedOptionsFromSnapshot(row.selected_options_snapshot ?? {}, row.currency);
  const transactionId = row.stripe_payment_intent_id ?? row.nowpayments_payment_id ?? row.checkout_session_id;
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
    updatedAt: formatDate(row.updated_at),
    amount: formatMoney(row.total, row.currency),
    total: Number(row.total),
    currency: row.currency,
    status: row.status,
    paymentProvider: row.payment_provider,
    transactionId,
    checkoutSessionId: row.checkout_session_id,
    orderReference: row.checkout_session_id,
    cryptoRefundAddress: row.crypto_refund_address ?? undefined,
    region: row.region,
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
  "id, user_id, service_id, checkout_session_id, selected_options_snapshot, total, currency, region, payment_provider, stripe_payment_intent_id, nowpayments_payment_id, crypto_refund_address, status, refund_previous_status, created_at, updated_at, services(title, image, games(name), service_categories(name)), order_items(id, service_id, selected_options_snapshot, total, currency, region, services(title, image, games(name), service_categories(name)))";

export async function listAdminOrders() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(orderSelect)
    .order("created_at", { ascending: false })
    .returns<AdminOrderRow[]>();

  if (error) throw error;

  const customers = await getCustomersById((data ?? []).map((order) => order.user_id));
  return (data ?? []).map((order) => mapOrder(order, customers.get(order.user_id)));
}

export async function getAdminOrder(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select(orderSelect)
    .eq("id", id)
    .maybeSingle<AdminOrderRow>();

  if (error) throw error;
  if (!data) return null;

  const customers = await getCustomersById([data.user_id]);
  return mapOrder(data, customers.get(data.user_id));
}
