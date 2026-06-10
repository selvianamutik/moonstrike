"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { ActionTooltip } from "@/components/common/ActionTooltip";
import { formatOrderDate } from "@/lib/orders";
import { formatTransactionMoney, type CustomerTransaction } from "@/lib/transactions";

export function ProfileTransactionsList({ transactions }: { transactions: CustomerTransaction[] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(transactions.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedTransactions = transactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const showingFrom = transactions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const showingTo = transactions.length > 0 ? showingFrom + pagedTransactions.length - 1 : 0;

  return (
    <>
      <section className="mt-8 overflow-hidden rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)]">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-4 border-b border-[var(--ms-border)] px-5 py-4 mono text-xs uppercase tracking-[0.16em] text-[var(--ms-body)] md:grid-cols-[1.3fr_1fr_1fr_1fr_1fr_auto]">
          <span>Transaction ID</span>
          <span className="hidden md:block">Provider</span>
          <span>Date</span>
          <span>Amount</span>
          <span className="hidden md:block">Status</span>
          <span className="text-right">Action</span>
        </div>
        {transactions.length === 0 ? (
          <div className="px-5 py-6 text-sm text-[var(--ms-body)]">No transactions yet.</div>
        ) : (
          pagedTransactions.map((transaction) => (
            <div key={transaction.id} className="grid grid-cols-[1fr_1fr_auto] items-center gap-4 border-b border-[var(--ms-border)] px-5 py-4 text-sm last:border-0 md:grid-cols-[1.3fr_1fr_1fr_1fr_1fr_auto]">
              <span className="mono truncate">{transaction.id}</span>
              <span className="hidden md:block">{transaction.method}</span>
              <span>{formatOrderDate(transaction.createdAt)}</span>
              <span className="mono text-[var(--ms-price)]">{formatTransactionMoney(transaction.amount, transaction.currency)}</span>
              <span className="hidden text-[var(--ms-success)] md:block">{transaction.status.replace("_", " ")}</span>
              <ActionTooltip label="View detail">
                <Link href={`/profile/transactions/${transaction.id}`} className="ms-action-button inline-flex h-9 items-center justify-center rounded-md border border-[var(--ms-border)] px-3 text-xs text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-heading)]">
                  <Eye size={14} />
                </Link>
              </ActionTooltip>
            </div>
          ))
        )}
      </section>

      {transactions.length > 0 ? (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] px-5 py-4 text-sm text-[var(--ms-body)] md:flex-row md:items-center md:justify-between">
          <span>
            Showing {showingFrom} to {showingTo} of {transactions.length.toLocaleString()}
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs">
              <span>Rows</span>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-[var(--ms-border)] bg-[var(--ms-bg-card)] px-2.5 py-2 text-xs text-[var(--ms-heading)] outline-none"
              >
                {[10, 20, 50, 100].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-1">
              <button type="button" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="ms-action-icon disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous page">
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 text-xs">
                Page {currentPage} of {totalPages}
              </span>
              <button type="button" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="ms-action-icon disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next page">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
