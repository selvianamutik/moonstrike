"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Gamepad2,
  Box,
  ShoppingBag,
  ReceiptText,
  Layers,
  MessageSquare,
  History,
  Settings,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Games", href: "/admin/games", icon: Gamepad2 },
  { name: "Services", href: "/admin/services", icon: Box },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Transactions", href: "/admin/transactions", icon: ReceiptText },
  { name: "Content", href: "/admin/content", icon: Layers },
  { name: "Messages", href: "/admin/messages", icon: MessageSquare },
  { name: "Logs", href: "/admin/logs", icon: History },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

function isNavActive(pathname: string, href: string) {
  if (href === "/admin/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[var(--admin-sidebar-w,320px)] bg-[var(--admin-bg)] border-r border-[var(--admin-border)] flex flex-col z-50">
      <div className="h-16 flex items-center px-6 pt-4 pb-2">
        <Link href="/admin/dashboard" className="flex flex-col">
          <span className="text-[var(--admin-text)] text-xl font-bold font-display tracking-wide">MoonStrike</span>
          <span className="text-[var(--admin-muted)] text-xs">Admin Terminal</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1" aria-label="Admin navigation">
        {navItems.map((item) => {
          const isActive = isNavActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                isActive
                  ? "bg-[var(--admin-accent)] text-white shadow-[0_0_15px_var(--admin-accent-hover)]"
                  : "text-[var(--admin-muted)] hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={18} className={isActive ? "text-white" : "text-[var(--admin-muted)]"} aria-hidden="true" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
