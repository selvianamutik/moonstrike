"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, HelpCircle } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { adminOrders, adminTransactions, adminUsers } from "@/lib/admin-mock";

export function AdminTopBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const ref = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();
  const orderHits = q
    ? adminOrders.filter((o) => o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q)).slice(0, 3)
    : [];
  const txnHits = q
    ? adminTransactions.filter((t) => t.id.toLowerCase().includes(q)).slice(0, 3)
    : [];
  const userHits = q
    ? adminUsers.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)).slice(0, 3)
    : [];
  const hasResults = orderHits.length + txnHits.length + userHits.length > 0;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadAdmin() {
      const response = await fetch("/api/admin/me");
      const result = (await response.json().catch(() => null)) as {
        admin?: { displayName?: string };
      } | null;

      if (isMounted && response.ok && result?.admin?.displayName) {
        setAdminName(result.admin.displayName);
      }
    }

    loadAdmin();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <header className="fixed top-0 right-0 left-[var(--admin-sidebar-w,320px)] h-16 bg-[var(--admin-bg)] border-b border-[var(--admin-border)] flex items-center justify-between px-8 z-40">
      <div className="relative w-[400px]" ref={ref}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-[var(--admin-muted)]" aria-hidden="true" />
        </div>
        <input
          type="text"
          placeholder="Search orders, transactions, users..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text)] text-sm rounded-lg focus:ring-1 focus:ring-[var(--admin-accent)] focus:border-[var(--admin-accent)] block pl-10 p-2.5 min-h-[44px] outline-none placeholder:text-[var(--admin-muted)]"
          aria-label="Search orders, transactions, users"
          role="combobox"
          aria-expanded={open && !!q}
          aria-autocomplete="list"
          aria-haspopup="listbox"
        />
        {open && q && (
          <div
            className="absolute top-full left-0 right-0 mt-2 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-xl shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto"
            role="listbox"
            aria-label="Search results"
          >
            {!hasResults && <p className="px-4 py-3 text-sm text-[var(--admin-muted)]">No results for &quot;{query}&quot;</p>}
            {orderHits.length > 0 && (
              <div className="p-2">
                <p className="px-2 py-1 text-[10px] font-bold text-[var(--admin-muted)] tracking-wider">ORDERS</p>
                {orderHits.map((o) => (
                  <Link
                    key={o.id}
                    href={`/admin/orders/${o.id}`}
                    onClick={() => setOpen(false)}
                    role="option"
                    aria-selected={false}
                    className="block px-3 py-2 rounded-lg text-sm text-white hover:bg-white/5"
                  >
                    {o.id} &ndash; {o.customerName}
                  </Link>
                ))}
              </div>
            )}
            {txnHits.length > 0 && (
              <div className="p-2 border-t border-[var(--admin-border)]">
                <p className="px-2 py-1 text-[10px] font-bold text-[var(--admin-muted)] tracking-wider">TRANSACTIONS</p>
                {txnHits.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      router.push("/admin/transactions");
                    }}
                    role="option"
                    aria-selected={false}
                    className="block w-full text-left px-3 py-2 rounded-lg text-sm text-white hover:bg-white/5"
                  >
                    {t.id} &ndash; {t.customerName}
                  </button>
                ))}
              </div>
            )}
            {userHits.length > 0 && (
              <div className="p-2 border-t border-[var(--admin-border)]">
                <p className="px-2 py-1 text-[10px] font-bold text-[var(--admin-muted)] tracking-wider">USERS</p>
                {userHits.map((u) => (
                  <Link
                    key={u.id}
                    href={`/admin/users/${u.id}`}
                    onClick={() => setOpen(false)}
                    role="option"
                    aria-selected={false}
                    className="block px-3 py-2 rounded-lg text-sm text-white hover:bg-white/5"
                  >
                    {u.name} &ndash; {u.email}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <NotificationBell mode="admin" className="text-[var(--admin-muted)] hover:text-white" iconSize={20} label="Admin notifications" />
          <button type="button" className="text-[var(--admin-muted)] hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Help">
            <HelpCircle size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="h-8 w-px bg-[var(--admin-border)]" aria-hidden="true" />
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 min-h-[44px]"
          aria-label={`Logged in as ${adminName}. Click to logout.`}
        >
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-white">{adminName}</span>
            <span className="text-xs font-bold text-[var(--admin-danger)] tracking-wider hover:text-red-400">LOGOUT</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[var(--admin-border)] border border-[var(--admin-cyan-dim)] flex items-center justify-center" aria-hidden="true">
            <span className="text-white text-sm font-bold">AA</span>
          </div>
        </button>
      </div>
    </header>
  );
}
