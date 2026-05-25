import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type AdminPaginationProps = {
  showingFrom: number;
  showingTo: number;
  total: number;
  currentPage?: number;
  totalPages?: number;
};

export function AdminPagination({
  showingFrom,
  showingTo,
  total,
  currentPage = 1,
  totalPages = 1,
}: AdminPaginationProps) {
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-[#172554] text-sm text-[#94A3B8]">
      <span>
        Showing {showingFrom} to {showingTo} of {total.toLocaleString()}
      </span>
      <div className="flex items-center gap-1">
        <button type="button" className="p-2 rounded-lg hover:bg-[#172554] text-[#94A3B8] hover:text-white transition-colors" aria-label="Previous page">
          <ChevronLeft size={16} />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
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
            <button type="button" className="min-w-[32px] h-8 rounded-lg hover:bg-[#172554] text-[#94A3B8] hover:text-white text-sm">
              {totalPages}
            </button>
          </>
        )}
        <button type="button" className="p-2 rounded-lg hover:bg-[#172554] text-[#94A3B8] hover:text-white transition-colors" aria-label="Next page">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
