"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import type { NotificationRecord } from "@/lib/notifications";

type NotificationsFeedProps = {
  mode: "customer" | "admin";
  initialNotifications: NotificationRecord[];
};

type NotificationsPayload = {
  notifications?: NotificationRecord[];
};

type NotificationFilter = "all" | "unread" | "orders" | "refunds";

const filters: Array<{ id: NotificationFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "orders", label: "Orders" },
  { id: "refunds", label: "Refunds" },
];

function apiBase(mode: "customer" | "admin") {
  return mode === "admin" ? "/api/admin/notifications" : "/api/notifications";
}

function notificationUpdatedEvent(mode: "customer" | "admin") {
  return `moonstrike:${mode}-notifications-updated`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function NotificationsFeed({ mode, initialNotifications }: NotificationsFeedProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const [pendingDelete, setPendingDelete] = useState<NotificationRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const base = apiBase(mode);
  const limit = Math.max(initialNotifications.length, 50);

  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  const loadNotifications = useCallback(async () => {
    const response = await fetch(`${base}?limit=${limit}`, { cache: "no-store" }).catch(() => null);
    const payload = (await response?.json().catch(() => null)) as NotificationsPayload | null;

    if (response?.ok && Array.isArray(payload?.notifications)) {
      setNotifications(payload.notifications);
    }
  }, [base, limit]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadNotifications();
    }, 30_000);

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") void loadNotifications();
    }

    const eventName = notificationUpdatedEvent(mode);

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener(eventName, refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener(eventName, refreshWhenVisible);
    };
  }, [loadNotifications, mode]);

  async function markRead(id: string) {
    await fetch(`${base}/${id}/read`, { method: "POST" }).catch(() => null);
    setNotifications((current) => current.map((item) => (item.id === id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item)));
    window.dispatchEvent(new Event(notificationUpdatedEvent(mode)));
  }

  async function markAllRead() {
    await fetch(`${base}/read-all`, { method: "POST" }).catch(() => null);
    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? readAt })));
    window.dispatchEvent(new Event(notificationUpdatedEvent(mode)));
  }

  async function deletePendingNotification() {
    if (!pendingDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`${base}/${pendingDelete.id}`, { method: "DELETE" });

      if (!response.ok) return;

      setNotifications((current) => current.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
      window.dispatchEvent(new Event(notificationUpdatedEvent(mode)));
    } finally {
      setIsDeleting(false);
    }
  }

  function matchesFilter(notification: NotificationRecord, filter: NotificationFilter) {
    if (filter === "all") return true;
    if (filter === "unread") return !notification.readAt;
    if (filter === "orders") return notification.eventType.startsWith("order_");
    if (filter === "refunds") return notification.eventType.startsWith("refund_");
    return true;
  }

  const filterCounts = filters.reduce<Record<NotificationFilter, number>>(
    (counts, filter) => {
      counts[filter.id] = notifications.filter((notification) => matchesFilter(notification, filter.id)).length;
      return counts;
    },
    { all: 0, unread: 0, orders: 0, refunds: 0 },
  );
  const filteredNotifications = notifications.filter((notification) => matchesFilter(notification, activeFilter));
  const activeFilterLabel = filters.find((filter) => filter.id === activeFilter)?.label ?? "All";

  if (notifications.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-10 text-center">
        <p className="text-lg font-bold text-[var(--ms-heading)]">No notifications yet.</p>
        <p className="mt-2 text-sm text-[var(--ms-body)]">Order and refund updates will appear here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)]">
        <div className="flex flex-col gap-4 border-b border-[var(--ms-border)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold text-[var(--ms-heading)]">{filteredNotifications.length} notifications</p>
            <p className="mt-1 text-xs text-[var(--ms-body)]">{activeFilterLabel} filter</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`rounded-md border px-3 py-2 text-xs font-bold transition-colors ${
                  activeFilter === filter.id
                    ? "border-[var(--ms-gradient-end)] bg-[var(--ms-gradient-end)]/10 text-[var(--ms-heading)]"
                    : "border-[var(--ms-border)] text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-heading)]"
                }`}
              >
                {filter.label} <span className="ml-1 opacity-70">{filterCounts[filter.id]}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={markAllRead} className="rounded-lg border border-[var(--ms-border)] px-3 py-2 text-xs font-bold text-[var(--ms-gradient-end)] hover:border-[var(--ms-gradient-end)]">
            Mark all read
          </button>
        </div>
        {filteredNotifications.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-lg font-bold text-[var(--ms-heading)]">No {activeFilterLabel.toLowerCase()} notifications.</p>
            <p className="mt-2 text-sm text-[var(--ms-body)]">Try another filter or check back after new order updates.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--ms-border)]">
            {filteredNotifications.map((notification) => (
              <div key={notification.id} className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-white/5">
                <Link
                  href={notification.href || (mode === "admin" ? "/admin/notifications" : "/notifications")}
                  onClick={() => void markRead(notification.id)}
                  className="min-w-0 flex-1"
                >
                  <div className="flex items-start gap-4">
                    <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${notification.readAt ? "bg-white/15" : "bg-[var(--ms-gradient-end)]"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-base font-bold text-[var(--ms-heading)]">{notification.title}</h2>
                        {!notification.readAt ? <span className="rounded border border-[var(--ms-gradient-end)] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--ms-gradient-end)]">Unread</span> : null}
                      </div>
                      <p className="mt-1 text-sm text-[var(--ms-body)]">{notification.body}</p>
                      <p className="mt-3 text-xs text-[var(--ms-body)]">{formatTime(notification.createdAt)}</p>
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => setPendingDelete(notification)}
                  className="rounded-lg border border-[var(--ms-border)] p-2 text-[var(--ms-body)] transition-colors hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-200"
                  aria-label={`Delete notification: ${notification.title}`}
                  title="Delete notification"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete notification?"
        description={pendingDelete ? `This removes "${pendingDelete.title}" from your notification feed. This cannot be undone.` : "This notification will be removed from your feed."}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
        onClose={() => {
          if (!isDeleting) setPendingDelete(null);
        }}
        onConfirm={deletePendingNotification}
      />
    </>
  );
}
