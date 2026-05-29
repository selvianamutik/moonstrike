"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, HelpCircle } from "lucide-react";
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
    <header className="fixed top-0 right-0 left-[240px] h-16 bg-[var(--ms-primary)] border-b border-[var(--ms-accent)] flex items-center justify-between px-8 z-40">
      <div className="relative w-[400px]" ref={ref}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-[var(--ms-text-secondary)]" />
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
          className="w-full bg-[var(--ms-secondary)] border border-[var(--ms-accent)] text-[var(--ms-text-primary)] text-sm rounded-lg focus:ring-1 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] block pl-10 p-2.5 outline-none placeholder-[var(--ms-text-secondary)]"
        />
        {open && q && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto">
            {!hasResults && <p className="px-4 py-3 text-sm text-[var(--ms-text-secondary)]">No results for &quot;{query}&quot;</p>}
            {orderHits.length > 0 && (
              <div className="p-2">
                <p className="px-2 py-1 text-[10px] font-bold text-[var(--ms-text-secondary)] tracking-wider">ORDERS</p>
                {orderHits.map((o) => (
                  <Link
                    key={o.id}
                    href={`/admin/orders/${o.id}`}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm text-white hover:bg-white/5"
                  >
                    {o.id} — {o.customerName}
                  </Link>
                ))}
              </div>
            )}
            {txnHits.length > 0 && (
              <div className="p-2 border-t border-[var(--ms-accent)]">
                <p className="px-2 py-1 text-[10px] font-bold text-[var(--ms-text-secondary)] tracking-wider">TRANSACTIONS</p>
                {txnHits.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      router.push("/admin/transactions");
                    }}
                    className="block w-full text-left px-3 py-2 rounded-lg text-sm text-white hover:bg-white/5"
                  >
                    {t.id} — {t.customerName}
                  </button>
                ))}
              </div>
            )}
            {userHits.length > 0 && (
              <div className="p-2 border-t border-[var(--ms-accent)]">
                <p className="px-2 py-1 text-[10px] font-bold text-[var(--ms-text-secondary)] tracking-wider">USERS</p>
                {userHits.map((u) => (
                  <Link
                    key={u.id}
                    href={`/admin/users/${u.id}`}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm text-white hover:bg-white/5"
                  >
                    {u.name} — {u.email}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button type="button" className="text-[var(--ms-text-secondary)] hover:text-white transition-colors relative" aria-label="Notifications">
            <Bell size={20} />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-[#22D3EE] ring-2 ring-[var(--ms-primary)]" />
          </button>
          <button type="button" className="text-[var(--ms-text-secondary)] hover:text-white transition-colors" aria-label="Help">
            <HelpCircle size={20} />
          </button>
        </div>
        <div className="h-8 w-px bg-[var(--ms-accent)]" />
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3"
        >
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-white">{adminName}</span>
            <span className="text-xs font-bold text-[#EF4444] tracking-wider hover:text-red-400">LOGOUT</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[var(--ms-accent)] border border-[#22D3EE]/30 flex items-center justify-center">
            <span className="text-white text-sm font-bold">AA</span>
          </div>
        </button>
      </div>
    </header>
  );
}
