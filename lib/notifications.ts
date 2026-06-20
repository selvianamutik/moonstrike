import { DEFAULT_ADMIN_SETTINGS, getAdminSettings } from "@/lib/admin/settings";
import { appBaseUrl, renderMoonStrikeEmail, sendEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationRecipientType = "customer" | "admin";

export type NotificationEventType =
  | "order_created"
  | "order_confirmed"
  | "order_in_progress"
  | "order_delivered"
  | "order_completed"
  | "refund_requested"
  | "refund_approved"
  | "refund_denied";

export type NotificationRecord = {
  id: string;
  recipientType: NotificationRecipientType;
  eventType: NotificationEventType | string;
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};

type NotificationRow = {
  id: string;
  recipient_type: NotificationRecipientType;
  event_type: string;
  title: string;
  body: string;
  href: string;
  read_at: string | null;
  created_at: string;
};

type CreateNotificationInput = {
  recipientType: NotificationRecipientType;
  userId?: string;
  adminId?: string;
  eventType: NotificationEventType;
  title: string;
  body?: string;
  href?: string;
  metadata?: Record<string, unknown>;
  dedupeKey?: string;
};

type OrderNotificationInput = {
  orderId: string;
  orderRef: string;
  userId: string;
  serviceNames?: string[];
};

type OrderNotificationContextRow = {
  id: string;
  order_ref: string;
  user_id: string;
  order_items:
    | Array<{
        services: { title: string } | { title: string }[] | null;
      }>
    | null;
};

type CustomerEmailKind = "order_delivered" | "refund_approved" | "refund_denied";

function mapNotification(row: NotificationRow): NotificationRecord {
  return {
    id: row.id,
    recipientType: row.recipient_type,
    eventType: row.event_type,
    title: row.title,
    body: row.body,
    href: row.href,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

function serviceSummary(serviceNames?: string[]) {
  const names = Array.from(new Set((serviceNames ?? []).map((name) => name.trim()).filter(Boolean)));
  if (names.length === 0) return "Order service";
  if (names.length === 1) return names[0];
  return `${names[0]} + ${names.length - 1} more`;
}

function relationOne<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function getOrderNotificationContext(orderId: string): Promise<OrderNotificationInput | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_ref, user_id, order_items(services(title))")
    .eq("id", orderId)
    .maybeSingle<OrderNotificationContextRow>();

  if (error) throw error;
  if (!data) return null;

  return {
    orderId: data.id,
    orderRef: data.order_ref,
    userId: data.user_id,
    serviceNames: (data.order_items ?? [])
      .map((item) => relationOne(item.services)?.title)
      .filter((title): title is string => Boolean(title)),
  };
}

async function notificationSettings() {
  try {
    return await getAdminSettings();
  } catch {
    return DEFAULT_ADMIN_SETTINGS;
  }
}

async function customerEmailAddress(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);

  if (error) {
    console.error(`Could not load customer email for ${userId}`, error);
    return null;
  }

  return data.user?.email ?? null;
}

async function sendCustomerOrderEmail(input: OrderNotificationInput, kind: CustomerEmailKind) {
  const email = await customerEmailAddress(input.userId);
  if (!email) return;

  const orderUrl = `${appBaseUrl()}/profile/orders/${encodeURIComponent(input.orderRef)}`;

  const copy: Record<CustomerEmailKind, { subject: string; title: string; body: string }> = {
    order_delivered: {
      subject: "Your MoonStrike order was delivered",
      title: "Your order was delivered",
      body: `${input.orderRef} is ready for your review.`,
    },
    refund_approved: {
      subject: "Your MoonStrike refund was approved",
      title: "Refund approved",
      body: `${input.orderRef} has been refunded.`,
    },
    refund_denied: {
      subject: "Your MoonStrike refund request was denied",
      title: "Refund request denied",
      body: `${input.orderRef} has returned to its previous order status.`,
    },
  };

  const selected = copy[kind];
  const emailContent = renderMoonStrikeEmail({
    title: selected.title,
    body: selected.body,
    ctaLabel: "Open order details",
    ctaHref: orderUrl,
  });

  const result = await sendEmail({
    to: email,
    subject: selected.subject,
    text: emailContent.text,
    html: emailContent.html,
  });

  if (!result.sent) {
    console.warn(`Skipped ${kind} email for ${input.orderRef}: ${result.skippedReason}`);
  }
}

export async function createNotification(input: CreateNotificationInput): Promise<boolean> {
  const supabase = createAdminClient();

  const payload = {
    recipient_type: input.recipientType,
    user_id: input.recipientType === "customer" ? input.userId : null,
    admin_id: input.recipientType === "admin" ? input.adminId : null,
    event_type: input.eventType,
    title: input.title,
    body: input.body ?? "",
    href: input.href ?? "",
    metadata: input.metadata ?? {},
    dedupe_key: input.dedupeKey ?? null,
  };

  if (input.dedupeKey) {
    const { data: existing, error: lookupError } = await supabase
      .from("notifications")
      .select("id")
      .eq("dedupe_key", input.dedupeKey)
      .maybeSingle<{ id: string }>();

    if (lookupError) throw lookupError;
    if (existing) return false;

    const { error } = await supabase.from("notifications").insert(payload);
    if (error?.code === "23505") return false;
    if (error) throw error;
    return true;
  }

  const { error } = await supabase.from("notifications").insert(payload);
  if (error) throw error;
  return true;
}

export async function notifyAdmins(input: Omit<CreateNotificationInput, "recipientType" | "adminId" | "userId" | "dedupeKey"> & { dedupeKey: string }) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("id")
    .eq("status", "active")
    .returns<Array<{ id: string }>>();

  if (error) throw error;

  await Promise.all(
    (data ?? []).map((admin) =>
      createNotification({
        ...input,
        recipientType: "admin",
        adminId: admin.id,
        dedupeKey: `${input.dedupeKey}:${admin.id}`,
      }),
    ),
  );
}

export async function notifyOrderCreated(input: OrderNotificationInput) {
  const settings = await notificationSettings();
  if (!settings.notifyOrderCreated) return;

  const summary = serviceSummary(input.serviceNames);
  await notifyAdmins({
    eventType: "order_created",
    title: "New order received",
    body: `${input.orderRef} - ${summary}`,
    href: `/admin/orders/${input.orderRef}`,
    metadata: { orderId: input.orderId, orderRef: input.orderRef, serviceNames: input.serviceNames ?? [] },
    dedupeKey: `order_created:${input.orderId}`,
  });
}

export async function notifyOrderDelivered(input: OrderNotificationInput) {
  const created = await createNotification({
    recipientType: "customer",
    userId: input.userId,
    eventType: "order_delivered",
    title: "Your order was delivered",
    body: `${input.orderRef} is ready for your review.`,
    href: `/profile/orders/${input.orderRef}`,
    metadata: { orderId: input.orderId, orderRef: input.orderRef },
    dedupeKey: `order_delivered:${input.orderId}`,
  });

  if (created) await sendCustomerOrderEmail(input, "order_delivered");
}

export async function notifyOrderStatusChanged(input: OrderNotificationInput, status: "confirmed" | "in_progress") {
  const copy =
    status === "confirmed"
      ? {
          eventType: "order_confirmed" as const,
          title: "Order confirmed",
          body: `${input.orderRef} has been confirmed and is waiting to start.`,
          dedupeKey: `order_confirmed:${input.orderId}`,
        }
      : {
          eventType: "order_in_progress" as const,
          title: "Order in progress",
          body: `${input.orderRef} is now in progress.`,
          dedupeKey: `order_in_progress:${input.orderId}`,
        };

  await createNotification({
    recipientType: "customer",
    userId: input.userId,
    eventType: copy.eventType,
    title: copy.title,
    body: copy.body,
    href: `/profile/orders/${input.orderRef}`,
    metadata: { orderId: input.orderId, orderRef: input.orderRef, status },
    dedupeKey: copy.dedupeKey,
  });
}

export async function notifyOrderCompleted(input: OrderNotificationInput) {
  const settings = await notificationSettings();

  await createNotification({
    recipientType: "customer",
    userId: input.userId,
    eventType: "order_completed",
    title: "Order completed",
    body: `${input.orderRef} has been marked completed.`,
    href: `/profile/orders/${input.orderRef}`,
    metadata: { orderId: input.orderId, orderRef: input.orderRef },
    dedupeKey: `customer_order_completed:${input.orderId}`,
  });

  if (!settings.notifyOrderCompleted) return;

  await notifyAdmins({
    eventType: "order_completed",
    title: "Order completed",
    body: `${input.orderRef} has been marked completed.`,
    href: `/admin/orders/${input.orderRef}`,
    metadata: { orderId: input.orderId, orderRef: input.orderRef },
    dedupeKey: `admin_order_completed:${input.orderId}`,
  });
}

export async function notifyRefundRequested(input: OrderNotificationInput) {
  const settings = await notificationSettings();
  if (!settings.notifyRefundRequested) return;

  await notifyAdmins({
    eventType: "refund_requested",
    title: "Refund requested",
    body: `${input.orderRef} needs review.`,
    href: `/admin/orders/${input.orderRef}`,
    metadata: { orderId: input.orderId, orderRef: input.orderRef },
    dedupeKey: `refund_requested:${input.orderId}`,
  });
}

export async function notifyRefundApproved(input: OrderNotificationInput) {
  const created = await createNotification({
    recipientType: "customer",
    userId: input.userId,
    eventType: "refund_approved",
    title: "Refund approved",
    body: `${input.orderRef} has been refunded.`,
    href: `/profile/orders/${input.orderRef}`,
    metadata: { orderId: input.orderId, orderRef: input.orderRef },
    dedupeKey: `refund_approved:${input.orderId}`,
  });

  if (created) await sendCustomerOrderEmail(input, "refund_approved");
}

export async function notifyRefundDenied(input: OrderNotificationInput) {
  const created = await createNotification({
    recipientType: "customer",
    userId: input.userId,
    eventType: "refund_denied",
    title: "Refund request denied",
    body: `${input.orderRef} has returned to its previous order status.`,
    href: `/profile/orders/${input.orderRef}`,
    metadata: { orderId: input.orderId, orderRef: input.orderRef },
    dedupeKey: `refund_denied:${input.orderId}`,
  });

  if (created) await sendCustomerOrderEmail(input, "refund_denied");
}

export async function listNotifications(recipientType: NotificationRecipientType, recipientId: string, limit = 30) {
  const supabase = createAdminClient();
  const column = recipientType === "customer" ? "user_id" : "admin_id";
  const { data, error } = await supabase
    .from("notifications")
    .select("id, recipient_type, event_type, title, body, href, read_at, created_at")
    .eq("recipient_type", recipientType)
    .eq(column, recipientId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<NotificationRow[]>();

  if (error) throw error;
  return (data ?? []).map(mapNotification);
}

export async function getUnreadNotificationCount(recipientType: NotificationRecipientType, recipientId: string) {
  const supabase = createAdminClient();
  const column = recipientType === "customer" ? "user_id" : "admin_id";
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_type", recipientType)
    .eq(column, recipientId)
    .is("read_at", null);

  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(recipientType: NotificationRecipientType, recipientId: string, notificationId: string) {
  const supabase = createAdminClient();
  const column = recipientType === "customer" ? "user_id" : "admin_id";
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("recipient_type", recipientType)
    .eq(column, recipientId);

  if (error) throw error;
}

export async function markAllNotificationsRead(recipientType: NotificationRecipientType, recipientId: string) {
  const supabase = createAdminClient();
  const column = recipientType === "customer" ? "user_id" : "admin_id";
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_type", recipientType)
    .eq(column, recipientId)
    .is("read_at", null);

  if (error) throw error;
}

export async function deleteNotification(recipientType: NotificationRecipientType, recipientId: string, notificationId: string) {
  const supabase = createAdminClient();
  const column = recipientType === "customer" ? "user_id" : "admin_id";
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("recipient_type", recipientType)
    .eq(column, recipientId);

  if (error) throw error;
}

export async function cleanupReadNotifications(retentionDays = 30) {
  const safeRetentionDays = Number.isFinite(retentionDays) && retentionDays > 0 ? retentionDays : 30;
  const cutoffDate = new Date(Date.now() - safeRetentionDays * 24 * 60 * 60 * 1000);
  const cutoff = cutoffDate.toISOString();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("notifications")
    .delete()
    .not("read_at", "is", null)
    .lte("read_at", cutoff)
    .select("id");

  if (error) throw error;

  return {
    deletedCount: data?.length ?? 0,
    readNotificationsExpiresBefore: cutoff,
    retentionDays: safeRetentionDays,
  };
}
