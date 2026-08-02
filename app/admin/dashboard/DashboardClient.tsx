"use client";

import React, { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, CheckCircle2, CreditCard, Database, MessageSquareWarning, RotateCcw, Sparkles, Users } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { StatusBadge, type StatusType } from "@/components/admin/StatusBadge";
import type { AdminDashboardData, AdminDashboardPeriodDays } from "@/lib/admin/dashboard";

const periodOptions: Array<{ value: AdminDashboardPeriodDays; label: string }> = [
  { value: 1, label: "Today" },
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
  { value: 180, label: "Last 180 days" },
];

function UnauthorizedAlert() {
  const searchParams = useSearchParams();
  const isUnauthorized = searchParams.get("error") === "unauthorized";
  if (!isUnauthorized) return null;
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300 flex items-center gap-2">
      <AlertTriangle size={16} className="text-amber-400 shrink-0" />
      <span>You do not have permission to access that feature. Please contact your system administrator.</span>
    </div>
  );
}

export function DashboardClient({ initialDashboard, adminRole }: { initialDashboard: AdminDashboardData; adminRole: string }) {
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [selectedDays, setSelectedDays] = useState<AdminDashboardPeriodDays>(initialDashboard.period.days);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const isSuperAdmin = adminRole === "super_admin";

  function loadDashboard(days: AdminDashboardPeriodDays) {
    setSelectedDays(days);
    setError("");

    startTransition(async () => {
      const response = await fetch(`/api/admin/dashboard?days=${days}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.dashboard) {
        setError(payload.error ?? "Unable to refresh dashboard.");
        return;
      }

      setDashboard(payload.dashboard as AdminDashboardData);
    });
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <Suspense fallback={null}>
        <UnauthorizedAlert />
      </Suspense>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-[#94A3B8]">
            <span>Home</span>
            <span>&gt;</span>
            <span className="text-[#22D3EE]">Dashboard</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Operational Overview</h1>
          <p className="mt-2 text-sm text-[var(--admin-muted)]">
            Live store health from orders, transactions, customers, and support messages.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isPending ? <span className="text-xs font-medium text-[#64748B]">Refreshing...</span> : null}
          <select
            value={selectedDays}
            onChange={(event) => loadDashboard(Number(event.target.value) as AdminDashboardPeriodDays)}
            className="rounded-lg border border-[#172554] bg-[#0F172A] px-4 py-2.5 text-sm font-medium text-white outline-none transition-colors hover:border-[#8B5CF6] focus:border-[#8B5CF6]"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {isSuperAdmin && (
          <AdminStatCard title="TOTAL REVENUE" value={dashboard.stats.revenue} subtitle={`Successful payments / ${dashboard.period.label.toLowerCase()}`} icon={<CreditCard size={18} className="text-[#8B5CF6]" />} progressColor="bg-[#8B5CF6]" />
        )}
        <AdminStatCard title="ACTIVE CUSTOMERS" value={String(dashboard.stats.activeCustomers)} subtitle={`${dashboard.stats.newCustomers} new / ${dashboard.period.label.toLowerCase()}`} icon={<Users size={18} className="text-[#22D3EE]" />} progressColor="bg-[#22D3EE]" />
        <AdminStatCard title="COMPLETED ORDERS" value={String(dashboard.stats.completedOrders)} subtitle={`Completed / ${dashboard.period.label.toLowerCase()}`} icon={<CheckCircle2 size={18} className="text-green-500" />} progressColor="bg-green-500" />
        <AdminStatCard title="REFUND REQUESTS" value={String(dashboard.stats.refundRequests)} subtitle="Current requests needing review" icon={<RotateCcw size={18} className="text-amber-500" />} progressColor="bg-amber-500" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <AttentionCard title="Orders needing action" value={dashboard.stats.actionOrders} href="/admin/orders" description="Pending, delivered, and refund-requested orders." icon={<AlertTriangle size={18} className="text-amber-400" />} />
        <AttentionCard title="Unread support chats" value={dashboard.stats.unreadChatTickets} href="/admin/messages" description="Tickets with unread customer messages." icon={<MessageSquareWarning size={18} className="text-[#22D3EE]" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="flex flex-col rounded-xl border border-[#172554] bg-[#0F172A] p-6 lg:col-span-2">
          <div className="mb-8 flex items-center justify-between border-b border-[#172554] pb-4">
            <div>
              <h2 className="mb-1 text-lg font-bold text-white">Order Pulse</h2>
              <p className="text-sm text-[var(--admin-muted)]">Order count and successful payment value for {dashboard.period.label.toLowerCase()}.</p>
            </div>
            {isSuperAdmin && (
              <div className="flex flex-wrap items-center gap-4">
                <LegendDot color="bg-[#22D3EE]" label="Orders" />
                <LegendDot color="bg-[#8B5CF6]" label="USD" />
                <LegendDot color="bg-green-500" label="EUR" />
              </div>
            )}
          </div>

          <div className="h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboard.chartDays} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="rgba(23,37,84,0.8)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  yAxisId="orders"
                  tick={{ fill: "#94A3B8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={38}
                />
                {isSuperAdmin && (
                  <YAxis
                    yAxisId="revenue"
                    orientation="right"
                    tick={{ fill: "#94A3B8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tickFormatter={(value: number) => `${Math.round(value)}`}
                  />
                )}
                <Tooltip content={<PulseTooltip />} cursor={{ stroke: "rgba(148,163,184,0.2)", strokeWidth: 1 }} />
                <Line
                  yAxisId="orders"
                  type="monotone"
                  dataKey="orders"
                  name="Orders"
                  stroke="#22D3EE"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#22D3EE", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#22D3EE", strokeWidth: 0 }}
                />
                {isSuperAdmin && (
                  <>
                    <Line
                      yAxisId="revenue"
                      type="monotone"
                      dataKey="revenueUsd"
                      name="USD Revenue"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#8B5CF6", strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: "#8B5CF6", strokeWidth: 0 }}
                    />
                    <Line
                      yAxisId="revenue"
                      type="monotone"
                      dataKey="revenueEur"
                      name="EUR Revenue"
                      stroke="#22C55E"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#22C55E", strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: "#22C55E", strokeWidth: 0 }}
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {isSuperAdmin && (
          <section className="rounded-xl border border-[#172554] bg-[#0F172A] p-6">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Top Selling Services</h2>
                <p className="mt-1 text-xs text-[#64748B]">Non-refunded order items / {dashboard.period.label.toLowerCase()}</p>
              </div>
              <Link href="/admin/services" className="text-xs font-bold text-[#22D3EE] hover:text-white">
                View all
              </Link>
            </div>
            <div className="flex flex-col gap-6">
              {dashboard.topServices.length > 0 ? (
                dashboard.topServices.map((service) => (
                  <TopServiceItem key={service.name} name={service.name} image={service.image} category={`${service.category} / ${service.count} order item${service.count === 1 ? "" : "s"}`} revenue={service.revenue} />
              ))
              ) : (
                <p className="rounded-lg border border-[#172554] bg-[#020617]/40 p-4 text-sm text-[#64748B]">
                  No non-refunded order item sales in {dashboard.period.label.toLowerCase()} yet.
                </p>
              )}
            </div>
          </section>
        )}
      </div>

      <section className="flex flex-col overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
        <div className="flex items-center justify-between border-b border-[var(--admin-border)] p-6">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Orders</h2>
            <p className="mt-1 text-xs text-[#64748B]">{dashboard.period.label}</p>
          </div>
          <Link href="/admin/orders" className="flex items-center gap-1 text-sm font-medium text-[var(--admin-cyan)] transition-colors hover:text-[var(--admin-accent)]">
            View Orders <ArrowRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--admin-muted)]">
            <thead className="border-b border-[var(--admin-border)] bg-[var(--admin-surface-header)] text-xs font-semibold uppercase text-[var(--admin-muted-dark)]">
              <tr>
                <th className="px-6 py-4">ORDER ID</th>
                <th className="px-6 py-4">CUSTOMER</th>
                <th className="px-6 py-4">ITEMS</th>
                <th className="px-6 py-4">DATE</th>
                <th className="px-6 py-4">AMOUNT</th>
                <th className="px-6 py-4">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-border)]">
              {dashboard.recentOrders.length > 0 ? (
                dashboard.recentOrders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-[#111827]">
                    <td className="whitespace-nowrap px-6 py-4 font-mono font-medium text-white">
                      <Link href={`/admin/orders/${order.orderReference}`} className="hover:text-[#22D3EE]">
                        {order.orderReference}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-[#22D3EE]/30 bg-[#172554]">
                          <span className="text-[10px] text-white">{order.customerName.substring(0, 2).toUpperCase()}</span>
                        </div>
                        <span className="text-white">{order.customerName}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-white">
                      {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">{order.createdAt}</td>
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-[#22D3EE]">{order.amount}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <StatusBadge status={order.status as StatusType} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-sm text-[var(--admin-muted)]">
                    No orders found in {dashboard.period.label.toLowerCase()}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
        <div className="flex items-center justify-between border-b border-[var(--admin-border)] p-6">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Transactions</h2>
            <p className="mt-1 text-xs text-[#64748B]">{dashboard.period.label}</p>
          </div>
          <Link href="/admin/transactions" className="flex items-center gap-1 text-sm font-medium text-[var(--admin-cyan)] transition-colors hover:text-[var(--admin-accent)]">
            View Transactions <ArrowRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--admin-muted)]">
            <thead className="border-b border-[var(--admin-border)] bg-[var(--admin-surface-header)] text-xs font-semibold uppercase text-[var(--admin-muted-dark)]">
              <tr>
                <th className="px-6 py-4">TRANSACTION ID</th>
                <th className="px-6 py-4">CUSTOMER</th>
                <th className="px-6 py-4">DATE</th>
                <th className="px-6 py-4">AMOUNT</th>
                <th className="px-6 py-4">PROVIDER</th>
                <th className="px-6 py-4">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-border)]">
              {dashboard.recentTransactions.length > 0 ? (
                dashboard.recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="transition-colors hover:bg-[#111827]">
                    <td className="whitespace-nowrap px-6 py-4 font-mono font-medium text-white">
                      <Link href={`/admin/transactions/${transaction.id}`} className="hover:text-[#22D3EE]">
                        {transaction.id}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-[#22D3EE]/30 bg-[#172554]">
                          <span className="text-[10px] text-white">{transaction.customerName.substring(0, 2).toUpperCase()}</span>
                        </div>
                        <span className="text-white">{transaction.customerName}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">{transaction.date}</td>
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-[#22D3EE]">{transaction.amount}</td>
                    <td className="whitespace-nowrap px-6 py-4 capitalize">{transaction.paymentProvider}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <StatusBadge status={transaction.status as StatusType} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-sm text-[var(--admin-muted)]">
                    No transactions found in {dashboard.period.label.toLowerCase()}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isSuperAdmin && <StorageMigrationPanel />}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-xs text-[#94A3B8]">{label}</span>
    </div>
  );
}

function PulseTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-[#172554] bg-[#020617] px-3 py-2 text-xs shadow-xl">
      <p className="mb-2 font-bold text-white">{label}</p>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center justify-between gap-5 text-[#94A3B8]">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.name}
          </span>
          <span className="font-mono text-white">
            {item.name === "USD Revenue"
              ? `$${Number(item.value ?? 0).toFixed(2)}`
              : item.name === "EUR Revenue"
                ? `€${Number(item.value ?? 0).toFixed(2)}`
                : Number(item.value ?? 0)}
          </span>
        </div>
      ))}
    </div>
  );
}

function AttentionCard({ title, value, href, description, icon }: { title: string; value: number; href: string; description: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-xl border border-[#172554] bg-[#0F172A] p-5 transition-colors hover:border-[#8B5CF6]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#172554] bg-[#172554]/50">
            {icon}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">{title}</p>
            <p className="mt-1 text-sm text-[#64748B]">{description}</p>
          </div>
        </div>
        <div className="text-3xl font-black text-white">{value}</div>
      </div>
    </Link>
  );
}

// ─── Storage Migration Panel (temporary — remove after migration complete) ────

type MigrationResult = {
  total: number
  migrated: number
  skipped: number
  failed: number
  errors: Array<{ path: string; error: string }>
  dryRun: boolean
  message: string
}

function StorageMigrationPanel() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle")
  const [result, setResult] = useState<MigrationResult | null>(null)
  const [prefix, setPrefix] = useState("")

  async function run(dryRun: boolean) {
    setStatus("running")
    setResult(null)
    try {
      const res = await fetch("/api/admin/migrate-storage-to-r2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun, prefix: prefix.trim() || undefined }),
      })
      const data = await res.json()
      setResult(data)
      setStatus(data.ok === false ? "error" : "done")
    } catch (err) {
      setResult({ total: 0, migrated: 0, skipped: 0, failed: 0, errors: [], dryRun, message: err instanceof Error ? err.message : "Request failed" })
      setStatus("error")
    }
  }

  return (
    <section className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Database size={18} className="text-amber-400 shrink-0" />
        <div>
          <h2 className="text-base font-bold text-white">Supabase → R2 Storage Migration</h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">One-time migration. Remove this panel after use.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
          placeholder="Filter prefix (e.g. games) — leave empty for all"
          className="h-9 flex-1 min-w-[220px] rounded-md border border-[#172554] bg-[#050816] px-3 text-sm text-white placeholder:text-[#475569] outline-none"
        />
        <button
          type="button"
          disabled={status === "running"}
          onClick={() => run(true)}
          className="h-9 rounded-md border border-[#22D3EE]/40 px-4 text-xs font-bold uppercase tracking-[0.1em] text-[#22D3EE] hover:bg-[#22D3EE]/10 disabled:opacity-50"
        >
          {status === "running" ? "Running..." : "Dry Run"}
        </button>
        <button
          type="button"
          disabled={status === "running"}
          onClick={() => run(false)}
          className="h-9 rounded-md bg-amber-500 px-4 text-xs font-bold uppercase tracking-[0.1em] text-black hover:bg-amber-400 disabled:opacity-50"
        >
          {status === "running" ? "Migrating..." : "Run Migration"}
        </button>
      </div>

      {status === "running" && (
        <p className="text-sm text-[#94A3B8] animate-pulse">Migration in progress — do not close this page...</p>
      )}

      {result && (
        <div className="mt-3 rounded-lg border border-[#172554] bg-[#050816] p-4 text-sm space-y-2">
          <p className={`font-bold ${status === "error" ? "text-red-400" : "text-green-400"}`}>{result.message}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs text-[#94A3B8]">
            <span>Total: <span className="text-white font-bold">{result.total}</span></span>
            <span>Migrated: <span className="text-green-400 font-bold">{result.migrated}</span></span>
            <span>Skipped: <span className="text-[#22D3EE] font-bold">{result.skipped}</span></span>
            <span>Failed: <span className="text-red-400 font-bold">{result.failed}</span></span>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs text-red-300"><span className="text-red-500">{e.path}</span>: {e.error}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function TopServiceItem({ name, image, category, revenue }: { name: string; image: string | null; category: string; revenue: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-4">
        {image ? (
          <img src={image} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#172554] bg-[#050816]">
            <Sparkles size={18} className="text-[#8B5CF6]" />
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-white">{name}</div>
          <div className="truncate text-xs text-[#94A3B8]">{category}</div>
        </div>
      </div>
      <div className="shrink-0 text-sm font-medium text-[#8B5CF6]">{revenue}</div>
    </div>
  );
}
