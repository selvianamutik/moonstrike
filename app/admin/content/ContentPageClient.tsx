"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, Pencil } from "lucide-react";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { StatusBadge, type StatusType } from "@/components/admin/StatusBadge";
import { ActionTooltip } from "@/components/common/ActionTooltip";
import {
  CONTENT_BLOCK_SLUGS,
  normalizeLandingBenefitsData,
  normalizeLandingHeroData,
  type ContentBlockRow,
} from "@/lib/cms/landing";

function formatModified(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ContentPageClient({ landingBlocks }: { landingBlocks: ContentBlockRow[] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(landingBlocks.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedBlocks = landingBlocks.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const showingFrom = landingBlocks.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const showingTo = landingBlocks.length > 0 ? showingFrom + pagedBlocks.length - 1 : 0;

  return (
    <AdminDataTable
      columns={["CONTENT ITEM", "TYPE", "STATUS", "MODIFIED", "ACTIONS"]}
      footer={
        <AdminPagination
          showingFrom={showingFrom}
          showingTo={showingTo}
          total={landingBlocks.length}
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
      {pagedBlocks.map((item) => {
        const summary =
          item.type === "hero"
            ? normalizeLandingHeroData(item.data).headline
            : normalizeLandingBenefitsData(item.data).title;

        return (
          <tr key={item.id} className="hover:bg-[#111827] transition-colors">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt="" className="h-8 w-12 rounded object-cover" />
                ) : (
                  <div className="w-12 h-8 rounded bg-[var(--ms-accent)]" />
                )}
                <div>
                  <div className="text-white font-medium">{item.name}</div>
                  <div className="text-xs text-[#64748B]">{summary}</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 text-sm">{item.type.replace("_", " ")}</td>
            <td className="px-6 py-4">
              <StatusBadge status={item.status as StatusType} />
            </td>
            <td className="px-6 py-4">{formatModified(item.modified_at)}</td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-1">
                <ActionTooltip label="Edit">
                  <Link
                    href={`/admin/content/${CONTENT_BLOCK_SLUGS[item.type as keyof typeof CONTENT_BLOCK_SLUGS] ?? item.id}/edit`}
                    className="admin-action-icon hover:border-[#8B5CF6] hover:text-[#8B5CF6]"
                    aria-label={`Edit ${item.name}`}
                  >
                    <Pencil size={16} />
                  </Link>
                </ActionTooltip>
                <ActionTooltip label="Preview">
                  <Link
                    href="/"
                    className="admin-action-icon hover:border-[#22D3EE] hover:text-[#22D3EE]"
                    aria-label={`Preview ${item.name}`}
                  >
                    <Eye size={16} />
                  </Link>
                </ActionTooltip>
              </div>
            </td>
          </tr>
        );
      })}
    </AdminDataTable>
  );
}
