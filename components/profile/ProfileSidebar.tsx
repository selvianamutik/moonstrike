"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CreditCard, MessageSquare, Pencil, ReceiptText, ShoppingBag } from "lucide-react";
import { LogoutButton } from "@/components/common/LogoutButton";

type ProfileSidebarProps = {
  displayName: string;
  email?: string | null;
  initials: string;
  memberSince?: string;
  totalOrders?: number;
  totalSpent?: string;
};

const navItems = [
  { name: "Orders", href: "/profile/orders", icon: ShoppingBag },
  { name: "Transactions", href: "/profile/transactions", icon: ReceiptText },
  { name: "Chat", href: "/profile/chat", icon: MessageSquare },
  { name: "Edit Profile", href: "/profile/edit", icon: Pencil },
];

function isActive(pathname: string, href: string) {
  const path = href.split("#")[0];
  if (path === "/profile") return pathname === "/profile";
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function ProfileSidebar({ displayName, email, initials, memberSince, totalOrders, totalSpent }: ProfileSidebarProps) {
  const pathname = usePathname();
  const [unreadChatTickets, setUnreadChatTickets] = useState(0);

  async function loadUnreadChatTickets() {
    if (document.visibilityState !== "visible") return;

    const response = await fetch("/api/chat/unread", { cache: "no-store" }).catch(() => null);
    const payload = (await response?.json().catch(() => null)) as { unreadTicketCount?: number } | null;

    if (response?.ok && typeof payload?.unreadTicketCount === "number") {
      setUnreadChatTickets(payload.unreadTicketCount);
    }
  }

  useEffect(() => {
    void loadUnreadChatTickets();

    const intervalId = window.setInterval(loadUnreadChatTickets, 30_000);
    window.addEventListener("focus", loadUnreadChatTickets);
    window.addEventListener("moonstrike:customer-messages-read", loadUnreadChatTickets);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", loadUnreadChatTickets);
      window.removeEventListener("moonstrike:customer-messages-read", loadUnreadChatTickets);
    };
  }, []);

  return (
    <aside className="ms-card h-fit max-w-full rounded-xl p-5 lg:sticky lg:top-28">
      <div className="flex items-center gap-4 border-b border-[var(--ms-border)] pb-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[var(--ms-gradient-end)] bg-[var(--ms-hover-bg)] font-display text-xl font-black">
          {initials}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-black">{displayName}</h1>
          {email ? <p className="mt-1 truncate text-sm text-[var(--ms-body)]">{email}</p> : null}
        </div>
      </div>

      {memberSince || typeof totalOrders === "number" || totalSpent ? (
        <dl className="space-y-3 border-b border-[var(--ms-border)] py-5 text-sm">
          {memberSince ? (
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--ms-body)]">Member since</dt>
              <dd>{memberSince}</dd>
            </div>
          ) : null}
          {typeof totalOrders === "number" ? (
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--ms-body)]">Orders</dt>
              <dd>{totalOrders}</dd>
            </div>
          ) : null}
          {totalSpent ? (
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--ms-body)]">Spent</dt>
              <dd className="mono text-right text-[var(--ms-price)]">{totalSpent}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <nav className="py-5">
        <div className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--primary)] text-white shadow-[0_0_18px_rgba(139,92,246,0.25)]"
                    : "text-[var(--ms-body)] hover:bg-white/5 hover:text-[var(--ms-heading)]"
                }`}
              >
                <Icon size={18} />
                <span className="flex-1">{item.name}</span>
                {item.href === "/profile/chat" && unreadChatTickets > 0 ? (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--ms-danger)] px-1.5 text-[10px] font-black leading-none text-white">
                    {unreadChatTickets > 9 ? "9+" : unreadChatTickets}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-[var(--ms-border)] pt-5">
        <LogoutButton />
        <div className="mt-3 flex items-center gap-2 mono text-[10px] uppercase tracking-[0.14em] text-[var(--ms-body)]">
          <CreditCard size={14} />
          Secure account area
        </div>
      </div>
    </aside>
  );
}
