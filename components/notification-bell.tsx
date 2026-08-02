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
  showLabel?: boolean;
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

// Throttle interval for polling (ms) — only fires when tab is visible
const POLL_INTERVAL_MS = 60_000; // 60s (was 30s)
// Minimum gap between any two loadUnread calls regardless of trigger
const THROTTLE_GAP_MS = 10_000; // 10s

// Session-level cache: key → { count, expiresAt }
const unreadCache = new Map<string, { count: number; expiresAt: number }>();
const CACHE_TTL_MS = 15_000; // cache valid for 15s

function getCachedUnread(key: string): number | null {
  const entry = unreadCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    unreadCache.delete(key);
    return null;
  }
  return entry.count;
}

function setCachedUnread(key: string, count: number) {
  unreadCache.set(key, { count, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function NotificationBell({ mode, className = "", iconSize = 22, label = "Notifications", showLabel = false }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const base = apiBase(mode);
  const pageHref = mode === "admin" ? "/admin/notifications" : "/notifications";
  // Timestamp of last loadUnread call for throttling
  const lastLoadRef = useRef<number>(0);

  const loadNotifications = useCallback(async () => {
    const response = await fetch(base, { cache: "no-store" }).catch(() => null);
    const payload = (await response?.json().catch(() => null)) as NotificationsPayload | null;
    if (response?.ok && Array.isArray(payload?.notifications)) {
      setNotifications(payload.notifications.slice(0, 5));
      const count = payload.notifications.filter((n) => !n.readAt).length;
      setUnreadCount(count);
      setCachedUnread(base, count);
      return payload.notifications;
    }
    return [];
  }, [base]);

  const loadUnread = useCallback(async (force = false) => {
    // Skip if tab is hidden (save requests when user isn't looking)
    if (document.visibilityState !== "visible") return;

    // Throttle: skip if called too recently (unless forced by event)
    const now = Date.now();
    if (!force && now - lastLoadRef.current < THROTTLE_GAP_MS) return;
    lastLoadRef.current = now;

    // Serve from cache if still fresh — but skip cache on forced calls
    if (!force) {
      const cached = getCachedUnread(base);
      if (cached !== null) {
        setUnreadCount(cached);
        return;
      }
    }

    const response = await fetch(`${base}/unread`, { cache: "no-store" }).catch(() => null);
    const payload = (await response?.json().catch(() => null)) as NotificationsPayload | null;
    if (response?.ok && typeof payload?.unreadCount === "number") {
      setUnreadCount(payload.unreadCount);
      setCachedUnread(base, payload.unreadCount);
    }
  }, [base]);

  useEffect(() => {
    void loadUnread(true);

    // Poll less frequently; skip when tab not visible
    const intervalId = window.setInterval(() => {
      void loadUnread();
    }, POLL_INTERVAL_MS);

    // Re-check when user returns to tab
    function onVisibilityChange() {
      if (document.visibilityState === "visible") void loadUnread();
    }

    // Re-check on window focus but throttle prevents excessive calls
    function onFocus() {
      void loadUnread();
    }

    const eventName = notificationUpdatedEvent(mode);

    window.addEventListener("focus", onFocus);
    window.addEventListener(eventName, loadNotifications);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
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
    await loadNotifications();
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
        className="relative inline-flex flex-col items-center justify-center text-inherit transition-colors hover:text-[var(--ms-gradient-end)]"
        aria-label={label}
        aria-expanded={isOpen}
      >
        <div className="relative flex h-10 w-10 items-center justify-center">
          <Bell size={iconSize} aria-hidden="true" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--ms-danger)] px-1 text-[10px] font-black leading-none text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </div>
        {showLabel ? (
          <span className="text-xs transition-colors duration-200">Notif</span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 mt-3 w-[340px] overflow-hidden rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[var(--ms-border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[var(--ms-heading)]">{label}</span>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--ms-danger)] px-1 text-[10px] font-black leading-none text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <button type="button" onClick={markAllRead} className="text-xs font-bold text-[var(--ms-gradient-end)] hover:text-[var(--ms-heading)]">
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
                  className="block border-b border-[var(--ms-border)] px-4 py-3 transition-colors hover:bg-[var(--ms-hover-bg)]"
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.readAt ? "bg-[var(--ms-border)]" : "bg-[var(--ms-gradient-end)]"}`} />
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
          <Link href={pageHref} onClick={() => setIsOpen(false)} className="block px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.16em] text-[var(--ms-gradient-end)] hover:bg-[var(--ms-hover-bg)]">
            View all
          </Link>
        </div>
      ) : null}
    </div>
  );
}
