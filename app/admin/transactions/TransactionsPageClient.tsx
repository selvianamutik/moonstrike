"use client";

import { useMemo, useState } from "react";
import { Download, DollarSign, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { StatusBadge, type StatusType } from "@/components/admin/StatusBadge";
import type { AdminTransactionRecord, AdminTransactionStats } from "@/lib/admin/transactions";

export function TransactionsPageClient({
  stats,
  transactions,
}: {
  stats: AdminTransactionStats;
  transactions: AdminTransactionRecord[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Status");

  const filtered = useMemo(() => {
    const query = search.toLowerCase();

    return transactions.filter((transaction) => {
      const matchSearch =
        !query ||
        transaction.id.toLowerCase().includes(query) ||
        transaction.checkoutSessionId.toLowerCase().includes(query) ||
        transaction.customerName.toLowerCase().includes(query) ||
        transaction.customerEmail.toLowerCase().includes(query);
      const matchStatus = status === "All Status" || transaction.status === status.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [search, status, transactions]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Transactions", active: true }]}
        title="Financial Ledger"
        description="Monitor real payment transactions from checkout providers."
        actions={
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-[var(--ms-accent)] bg-[var(--ms-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1E293B]"
          >
            <Download size={16} />
            Export Report
          </button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard title="TOTAL REVENUE" value={stats.totalRevenue} trend="From successful transactions" trendUp icon={<DollarSign size={18} className="text-[#8B5CF6]" />} progressColor="bg-[#8B5CF6]" progressWidth="w-[65%]" />
        <AdminStatCard title="PENDING PAYOUTS" value={stats.pendingPayouts} subtitle="Gateway settlement pending" icon={<Clock size={18} className="text-[#22D3EE]" />} progressColor="bg-[#22D3EE]" progressWidth="w-[30%]" />
        <AdminStatCard title="SUCCESS RATE" value={stats.successRate} subtitle="Payment completion" icon={<CheckCircle size={18} className="text-green-500" />} progressColor="bg-green-500" progressWidth="w-[98%]" />
        <AdminStatCard title="NEW DISPUTES" value={String(stats.newDisputes)} subtitle="Action required" icon={<AlertTriangle size={18} className="text-amber-500" />} progressColor="bg-amber-500" progressWidth="w-[15%]" />
      </div>

      <AdminFilterBar
        searchPlaceholder="Filter by ID or customer..."
        searchValue={search}
        onSearchChange={setSearch}
        statusOptions={["All Status", "success", "pending", "disputed", "refunded", "failed"]}
        statusValue={status}
        onStatusChange={setStatus}
        extra={
          <button type="button" className="rounded-lg border border-[var(--ms-accent)] bg-[var(--ms-secondary)] px-4 py-2.5 text-sm text-[var(--ms-text-secondary)]">
            Last 30 Days
          </button>
        }
      />

      <AdminDataTable
        columns={["TXN ID", "CUSTOMER", "SERVICE", "DATE", "AMOUNT", "METHOD", "STATUS", "ACTIONS"]}
        footer={<AdminPagination showingFrom={filtered.length > 0 ? 1 : 0} showingTo={filtered.length} total={transactions.length} totalPages={1} />}
      >
        {filtered.length === 0 ? (
          <tr>
            <td className="px-6 py-8 text-center text-[var(--ms-text-secondary)]" colSpan={8}>
              No transactions found.
            </td>
          </tr>
        ) : (
          filtered.map((transaction) => (
            <tr key={transaction.id} className="transition-colors hover:bg-[#111827]">
              <td className="px-6 py-4 font-mono font-medium text-white">{transaction.id}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ms-accent)] text-xs font-bold text-white">
                    {transaction.customerInitials}
                  </div>
                  <div>
                    <div className="text-sm text-white">{transaction.customerName}</div>
                    <div className="text-xs text-[#64748B]">{transaction.customerEmail}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex max-w-[220px] flex-wrap gap-1">
                  {transaction.services.map((service) => (
                    <span key={service} className="rounded bg-[var(--ms-accent)] px-2 py-0.5 text-xs text-[var(--ms-text-secondary)]">
                      {service}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4">{transaction.date}</td>
              <td className="px-6 py-4 font-medium text-[#22D3EE]">{transaction.amount}</td>
              <td className="px-6 py-4 text-sm">
                {transaction.method}
                <span className="block text-xs text-[#64748B]">
                  {transaction.paymentProvider === "stripe" ? "via Stripe" : "via NowPayments"}
                </span>
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={transaction.status as StatusType} />
              </td>
              <td className="px-6 py-4">
                <button
                  type="button"
                  disabled={!transaction.canRefund}
                  title={transaction.refundBlockedReason}
                  onClick={() => alert(transaction.canRefund ? "Refund API is not wired yet." : transaction.refundBlockedReason)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    transaction.canRefund
                      ? "border-red-500/40 text-red-400 hover:bg-red-500/10"
                      : "cursor-not-allowed border-[var(--ms-accent)] text-[#64748B]"
                  }`}
                >
                  Issue Refund
                </button>
              </td>
            </tr>
          ))
        )}
      </AdminDataTable>
    </div>
  );
}
