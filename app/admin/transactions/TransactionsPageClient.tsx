"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, DollarSign, CheckCircle, RotateCcw, Eye } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { SheetsSyncButton } from "@/components/admin/SheetsSyncButton";
import { StatusBadge, type StatusType } from "@/components/admin/StatusBadge";
import { ActionTooltip } from "@/components/common/ActionTooltip";
import type { AdminTransactionRecord, AdminTransactionStats } from "@/lib/admin/transactions";

type DateFilter = "all" | "7d" | "30d" | "custom";

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function matchesDateFilter(createdAtIso: string, dateFilter: DateFilter, dateFrom: string, dateTo: string) {
  if (dateFilter === "all") return true;

  const createdAt = new Date(createdAtIso).getTime();

  if (dateFilter === "7d" || dateFilter === "30d") {
    const days = dateFilter === "7d" ? 7 : 30;
    return Date.now() - createdAt <= days * 24 * 60 * 60 * 1000;
  }

  const from = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
  const to = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;

  return createdAt >= from && createdAt <= to;
}

function formatMoney(value: number, currency: "USD" | "EUR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

function formatMoneyParts(totals: Record<"USD" | "EUR", number>) {
  const parts = [];
  if (totals.USD > 0) parts.push(formatMoney(totals.USD, "USD"));
  if (totals.EUR > 0) parts.push(formatMoney(totals.EUR, "EUR"));
  return parts.join(" / ") || "$0.00";
}

export function TransactionsPageClient({
  stats: initialStats,
  transactions,
}: {
  stats: AdminTransactionStats;
  transactions: AdminTransactionRecord[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Status");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
      const matchDate = matchesDateFilter(transaction.dateIso, dateFilter, dateFrom, dateTo);
      return matchSearch && matchStatus && matchDate;
    });
  }, [dateFilter, dateFrom, dateTo, search, status, transactions]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedTransactions = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const showingFrom = filtered.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const showingTo = filtered.length > 0 ? showingFrom + pagedTransactions.length - 1 : 0;
  const stats = useMemo(() => {
    const collectedTotals = filtered.reduce(
      (sum, transaction) => {
        if (transaction.status === "success") sum[transaction.currency] += transaction.amountValue;
        return sum;
      },
      { EUR: 0, USD: 0 },
    );
    const refundedTotals = filtered.reduce(
      (sum, transaction) => {
        if (transaction.status === "refunded") sum[transaction.currency] += transaction.amountValue;
        return sum;
      },
      { EUR: 0, USD: 0 },
    );

    return {
      totalCollected: formatMoneyParts(collectedTotals),
      successfulCount: filtered.filter((transaction) => transaction.status === "success").length,
      refundedCount: filtered.filter((transaction) => transaction.status === "refunded").length,
      totalRefunded: formatMoneyParts(refundedTotals),
    } satisfies AdminTransactionStats;
  }, [filtered]);

  void initialStats;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Transactions", active: true }]}
        title="Financial Ledger"
        description="Monitor real payment transactions from checkout providers."
        actions={
          <>
            <SheetsSyncButton target="transactions" label="Sync Transactions" />
            <button
              type="button"
              className="admin-action-button rounded-lg border border-[var(--ms-accent)] bg-[var(--ms-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1E293B]"
            >
              <Download size={16} />
              Export Report
            </button>
          </>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard title="TOTAL COLLECTED" value={stats.totalCollected} subtitle="Successful transaction value" icon={<DollarSign size={18} className="text-[#8B5CF6]" />} progressColor="bg-[#8B5CF6]" progressWidth="w-[65%]" />
        <AdminStatCard title="SUCCESSFUL" value={String(stats.successfulCount)} subtitle="Provider-confirmed payments" icon={<CheckCircle size={18} className="text-green-500" />} progressColor="bg-green-500" progressWidth="w-[60%]" />
        <AdminStatCard title="REFUNDED" value={String(stats.refundedCount)} subtitle="Completed refunds" icon={<RotateCcw size={18} className="text-amber-500" />} progressColor="bg-amber-500" progressWidth="w-[15%]" />
        <AdminStatCard title="TOTAL REFUNDED" value={stats.totalRefunded} subtitle="Refunded transaction value" icon={<RotateCcw size={18} className="text-[#22D3EE]" />} progressColor="bg-[#22D3EE]" progressWidth="w-[35%]" />
      </div>

      <AdminFilterBar
        searchPlaceholder="Filter by ID or customer..."
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        statusOptions={["All Status", "success", "refunded"]}
        statusValue={status}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        extra={
          <>
            <select
              value={dateFilter}
              onChange={(event) => {
                const nextFilter = event.target.value as DateFilter;
                setDateFilter(nextFilter);
                if (nextFilter === "custom" && !dateTo) {
                  setDateTo(getTodayInputValue());
                }
                setPage(1);
              }}
              className="rounded-lg border border-[#172554] bg-[#0F172A] px-4 py-2.5 text-sm text-white outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
            >
              <option value="all">All Dates</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
            {dateFilter === "custom" ? (
              <div className="flex items-center gap-2 rounded-lg border border-[#172554] bg-[#0F172A] px-3 py-2 text-sm text-white focus-within:border-[#8B5CF6] focus-within:ring-1 focus-within:ring-[#8B5CF6]">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => {
                    setDateFrom(event.target.value);
                    setPage(1);
                  }}
                  className="w-[135px] bg-transparent text-sm text-white outline-none"
                  aria-label="Transaction date from"
                />
                <span className="text-[var(--ms-text-secondary)]">-</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => {
                    setDateTo(event.target.value);
                    setPage(1);
                  }}
                  className="w-[135px] bg-transparent text-sm text-white outline-none"
                  aria-label="Transaction date to"
                />
              </div>
            ) : null}
          </>
        }
      />

      <AdminDataTable
        columns={["TRANSACTION ID", "CUSTOMER", "DATE", "AMOUNT", "PROVIDER", "STATUS", "ACTIONS"]}
        footer={
          <AdminPagination
            showingFrom={showingFrom}
            showingTo={showingTo}
            total={filtered.length}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize);
              setPage(1);
            }}
          />
        }
      >
        {filtered.length === 0 ? (
          <tr>
            <td className="px-6 py-8 text-center text-[var(--ms-text-secondary)]" colSpan={7}>
              No transactions found.
            </td>
          </tr>
        ) : (
          pagedTransactions.map((transaction) => (
            <tr key={transaction.id} className="transition-colors hover:bg-[#111827]">
              <td className="px-6 py-4">
                <span className="font-mono font-medium text-white">{transaction.id}</span>
              </td>
              <td className="px-6 py-4">
                <div>
                  <div className="text-sm text-white">{transaction.customerName}</div>
                  <div className="text-xs text-[#64748B]">{transaction.customerEmail}</div>
                </div>
              </td>
              <td className="px-6 py-4">{transaction.date}</td>
              <td className="px-6 py-4 font-medium text-[#22D3EE]">{transaction.amount}</td>
              <td className="px-6 py-4 text-sm">
                {transaction.method}
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={transaction.status as StatusType} />
              </td>
              <td className="px-6 py-4">
                <ActionTooltip label="View detail">
                  <Link
                    href={`/admin/transactions/${transaction.id}`}
                    className="admin-action-icon hover:border-[#22D3EE] hover:text-white"
                    aria-label={`View transaction ${transaction.id}`}
                  >
                    <Eye size={14} />
                  </Link>
                </ActionTooltip>
              </td>
            </tr>
          ))
        )}
      </AdminDataTable>
    </div>
  );
}
