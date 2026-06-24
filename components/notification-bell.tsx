"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import type { NotificationRecord } from "@/lib/notifications";

type NotificationBellProps = {
  mode: "customer" | "admin";
  className?: string;
  iconSize?: number;
  label?: string;
};

type NotificationsPayload = {
  notifications?: NotificationRecord[];
  unreadCount?: number;
};

function apiBase(mode: "customer" | "admin") {
  return mode === "admin" ? "/api/admin/notifications" : "/api/notifications";
}

function notificationUpdatedEvent(mode: "customer" | "admin") {
  return `moonstrike:${mode}-notifications-updated`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function NotificationBell({ mode, className = "", iconSize = 22, label = "Notifications" }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const base = apiBase(mode);
  const pageHref = mode === "admin" ? "/admin/notifications" : "/notifications";

  const loadNotifications = useCallback(async () => {
    const response = await fetch(base, { cache: "no-store" }).catch(() => null);
    const payload = (await response?.json().catch(() => null)) as NotificationsPayload | null;
    if (response?.ok && Array.isArray(payload?.notifications)) {
      setNotifications(payload.notifications.slice(0, 5));
      setUnreadCount(payload.notifications.filter((notification) => !notification.readAt).length);
      return payload.notifications;
    }
    return [];
  }, [base]);

  const loadUnread = useCallback(async () => {
    const response = await fetch(`${base}/unread`, { cache: "no-store" }).catch(() => null);
    const payload = (await response?.json().catch(() => null)) as NotificationsPayload | null;
    if (response?.ok && typeof payload?.unreadCount === "number") {
      setUnreadCount(payload.unreadCount);
    }
  }, [base]);

  useEffect(() => {
    void loadUnread();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadUnread();
    }, 30_000);

    function onVisibilityChange() {
      if (document.visibilityState === "visible") void loadUnread();
    }

    const eventName = notificationUpdatedEvent(mode);

    window.addEventListener("focus", loadUnread);
    window.addEventListener(eventName, loadNotifications);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", loadUnread);
      window.removeEventListener(eventName, loadNotifications);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [loadNotifications, loadUnread, mode]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    }

    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function openMenu() {
    const next = !isOpen;
    setIsOpen(next);
    if (!next) return;

    const loadedNotifications = await loadNotifications();
    if (unreadCount > 0 || loadedNotifications.some((notification) => !notification.readAt)) {
      await markAllRead();
    }
  }

  async function markRead(id: string) {
    await fetch(`${base}/${id}/read`, { method: "POST" }).catch(() => null);
    setNotifications((current) => current.map((item) => (item.id === id ? { ...item, readAt: item.readAt ?? new Date().toISOString() } : item)));
    setUnreadCount((current) => Math.max(0, current - 1));
    window.dispatchEvent(new Event(notificationUpdatedEvent(mode)));
  }

  async function markAllRead() {
    await fetch(`${base}/read-all`, { method: "POST" }).catch(() => null);
    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? readAt })));
    setUnreadCount(0);
    window.dispatchEvent(new Event(notificationUpdatedEvent(mode)));
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={openMenu}
        className="relative inline-flex min-h-10 min-w-10 items-center justify-center text-inherit transition-colors hover:text-[var(--ms-gradient-end)]"
        aria-label={label}
        aria-expanded={isOpen}
      >
        <Bell size={iconSize} aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--ms-danger)] px-1 text-[10px] font-black leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 mt-3 w-[340px] overflow-hidden rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[var(--ms-border)] px-4 py-3">
            <span className="text-sm font-bold text-[var(--ms-heading)]">{label}</span>
            <button type="button" onClick={markAllRead} className="text-xs font-bold text-[var(--ms-gradient-end)] hover:text-white">
              Mark all read
            </button>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[var(--ms-body)]">No notifications yet.</div>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.href || pageHref}
                  onClick={() => {
                    void markRead(notification.id);
                    setIsOpen(false);
                  }}
                  className="block border-b border-[var(--ms-border)] px-4 py-3 transition-colors hover:bg-white/5"
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.readAt ? "bg-white/20" : "bg-[var(--ms-gradient-end)]"}`} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[var(--ms-heading)]">{notification.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-[var(--ms-body)]">{notification.body}</p>
                      <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-[var(--ms-body)]">{formatTime(notification.createdAt)}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
          <Link href={pageHref} onClick={() => setIsOpen(false)} className="block px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.16em] text-[var(--ms-gradient-end)] hover:bg-white/5">
            View all
          </Link>
        </div>
      ) : null}
    </div>
  );
}
