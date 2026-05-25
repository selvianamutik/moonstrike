"use client";

import React, { useState } from "react";
import { Download, DollarSign, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { StatusBadge, type StatusType } from "@/components/admin/StatusBadge";
import { adminTransactions, transactionStats } from "@/lib/admin-mock";

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Status");

  const filtered = adminTransactions.filter((t) => {
    const matchSearch =
      !search ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = status === "All Status" || t.status === status.toLowerCase();
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <AdminPageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Transactions", active: true }]}
        title="Financial Ledger"
        description="Monitor payments and issue refunds (auto-routed by provider on backend)."
        actions={
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-[var(--ms-accent)] border border-[var(--ms-accent)] rounded-lg text-sm font-medium text-white hover:bg-[#1E293B] transition-colors"
          >
            <Download size={16} />
            Export Report
          </button>
        }
      />

      <div className="grid grid-cols-4 gap-6">
        <AdminStatCard title="TOTAL REVENUE" value={transactionStats.totalRevenue} trend="+12.4% this month" trendUp icon={<DollarSign size={18} className="text-[#8B5CF6]" />} progressColor="bg-[#8B5CF6]" progressWidth="w-[65%]" />
        <AdminStatCard title="PENDING PAYOUTS" value={transactionStats.pendingPayouts} subtitle="Next cycle in 4d" icon={<Clock size={18} className="text-[#22D3EE]" />} progressColor="bg-[#22D3EE]" progressWidth="w-[30%]" />
        <AdminStatCard title="SUCCESS RATE" value={transactionStats.successRate} subtitle="High Efficiency" icon={<CheckCircle size={18} className="text-green-500" />} progressColor="bg-green-500" progressWidth="w-[98%]" />
        <AdminStatCard title="NEW DISPUTES" value={String(transactionStats.newDisputes)} subtitle="Action required" icon={<AlertTriangle size={18} className="text-amber-500" />} progressColor="bg-amber-500" progressWidth="w-[15%]" />
      </div>

      <AdminFilterBar
        searchPlaceholder="Filter by ID or Customer..."
        searchValue={search}
        onSearchChange={setSearch}
        statusOptions={["All Status", "success", "pending", "disputed", "refunded"]}
        statusValue={status}
        onStatusChange={setStatus}
        extra={
          <button type="button" className="px-4 py-2.5 bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-lg text-sm text-[var(--ms-text-secondary)]">
            Last 30 Days
          </button>
        }
      />

      <AdminDataTable
        columns={["TXN ID", "CUSTOMER", "SERVICE", "DATE", "AMOUNT", "METHOD", "STATUS", "ACTIONS"]}
        footer={<AdminPagination showingFrom={1} showingTo={filtered.length} total={2450} totalPages={612} />}
      >
        {filtered.map((txn) => (
          <tr key={txn.id} className="hover:bg-[#111827] transition-colors">
            <td className="px-6 py-4 text-white font-medium font-mono">{txn.id}</td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[var(--ms-accent)] flex items-center justify-center text-xs text-white font-bold">
                  {txn.customerInitials}
                </div>
                <div>
                  <div className="text-white text-sm">{txn.customerName}</div>
                  <div className="text-xs text-[#64748B]">{txn.customerEmail}</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="flex flex-wrap gap-1">
                {txn.services.map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded bg-[var(--ms-accent)] text-xs text-[var(--ms-text-secondary)]">
                    {s}
                  </span>
                ))}
              </div>
            </td>
            <td className="px-6 py-4">{txn.date}</td>
            <td className="px-6 py-4 text-[#22D3EE] font-medium">{txn.amount}</td>
            <td className="px-6 py-4 text-sm">
              {txn.method}
              <span className="block text-xs text-[#64748B]">
                {txn.paymentProvider === "stripe" ? "via Stripe" : "via NowPayments"}
              </span>
            </td>
            <td className="px-6 py-4">
              <StatusBadge status={txn.status as StatusType} />
            </td>
            <td className="px-6 py-4">
              <button
                type="button"
                disabled={!txn.canRefund}
                title={txn.refundBlockedReason}
                onClick={() => alert(txn.canRefund ? "Issue refund (mock — routes to Stripe/NowPayments)" : txn.refundBlockedReason)}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                  txn.canRefund
                    ? "border-red-500/40 text-red-400 hover:bg-red-500/10"
                    : "border-[var(--ms-accent)] text-[#64748B] cursor-not-allowed"
                }`}
              >
                Issue Refund
              </button>
            </td>
          </tr>
        ))}
      </AdminDataTable>
    </div>
  );
}
