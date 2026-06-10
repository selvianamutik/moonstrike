import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type AdminPaginationProps = {
  showingFrom: number;
  showingTo: number;
  total: number;
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
};

export function AdminPagination({
  showingFrom,
  showingTo,
  total,
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
}: AdminPaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const startPage = Math.max(1, Math.min(currentPage - 2, safeTotalPages - 4));
  const pages = Array.from({ length: Math.min(safeTotalPages, 5) }, (_, i) => startPage + i);

  return (
    <div className="flex flex-col gap-3 border-t border-[#172554] px-6 py-4 text-sm text-[#94A3B8] lg:flex-row lg:items-center lg:justify-between">
      <span>
        Showing {showingFrom} to {showingTo} of {total.toLocaleString()}
      </span>
      <div className="flex flex-wrap items-center gap-3">
        {onPageSizeChange ? (
          <label className="flex items-center gap-2 text-xs">
            <span>Rows</span>
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="rounded-lg border border-[#172554] bg-[#0F172A] px-2.5 py-2 text-xs text-white outline-none hover:border-[#8B5CF6]"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
          className="rounded-lg p-2 text-[#94A3B8] transition-colors hover:bg-[#172554] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange?.(p)}
            className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${
              p === currentPage ? "bg-[#8B5CF6] text-white" : "hover:bg-[#172554] text-[#94A3B8] hover:text-white"
            }`}
          >
            {p}
          </button>
        ))}
        {totalPages > 5 && (
          <>
            <span className="px-1">...</span>
            <button
              type="button"
              onClick={() => onPageChange?.(safeTotalPages)}
              className="min-w-[32px] h-8 rounded-lg hover:bg-[#172554] text-[#94A3B8] hover:text-white text-sm"
            >
              {totalPages}
            </button>
          </>
        )}
        <button
          type="button"
          disabled={currentPage >= safeTotalPages}
          onClick={() => onPageChange?.(Math.min(safeTotalPages, currentPage + 1))}
          className="rounded-lg p-2 text-[#94A3B8] transition-colors hover:bg-[#172554] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
        </div>
      </div>
    </div>
  );
}
