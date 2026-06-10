"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export function PageSizePagination({
  currentPage,
  pageSize,
  showingFrom,
  showingTo,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: {
  currentPage: number;
  pageSize: number;
  showingFrom: number;
  showingTo: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  if (total <= 0) return null;

  return (
    <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] px-5 py-4 text-sm text-[var(--ms-body)] md:flex-row md:items-center md:justify-between">
      <span>
        Showing {showingFrom} to {showingTo} of {total.toLocaleString()}
      </span>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs">
          <span>Rows</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
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
          <button type="button" disabled={currentPage <= 1} onClick={() => onPageChange(Math.max(1, currentPage - 1))} className="ms-action-icon disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous page">
            <ChevronLeft size={16} />
          </button>
          <span className="px-2 text-xs">
            Page {currentPage} of {totalPages}
          </span>
          <button type="button" disabled={currentPage >= totalPages} onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} className="ms-action-icon disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next page">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
