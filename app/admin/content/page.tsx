import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, Pencil } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { StatusBadge, type StatusType } from "@/components/admin/StatusBadge";
import { getAdminSession } from "@/lib/admin/session";
import {
  ensureLandingBenefitsBlock,
  ensureLandingHeroBlock,
  CONTENT_BLOCK_SLUGS,
  listAdminContentBlocks,
  normalizeLandingBenefitsData,
  normalizeLandingHeroData,
} from "@/lib/cms/landing";

function formatModified(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function ContentPage() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin/login?next=/admin/content");
  }

  await Promise.all([
    ensureLandingHeroBlock(admin.id),
    ensureLandingBenefitsBlock(admin.id),
  ]);
  const blocks = await listAdminContentBlocks();
  const landingBlocks = blocks.filter((block) => block.type === "hero" || block.type === "benefits_section");

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <AdminPageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Content", active: true }]}
        title="Content Library"
        description="Landing hero and Why Choose Us are backed by Supabase content_blocks and rendered on the storefront."
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="px-3 py-2 rounded-lg text-xs font-bold tracking-wide bg-[#8B5CF6] text-white"
        >
          LANDING PAGE SECTIONS
        </button>
        <button
          type="button"
          className="px-3 py-2 rounded-lg text-xs font-bold tracking-wide text-[var(--ms-text-secondary)] border border-[var(--ms-accent)]"
        >
          PROMOTIONAL BANNERS
        </button>
        <button
          type="button"
          className="px-3 py-2 rounded-lg text-xs font-bold tracking-wide text-[var(--ms-text-secondary)] border border-[var(--ms-accent)]"
        >
          MEDIA LIBRARY
        </button>
      </div>

      <AdminDataTable
        columns={["CONTENT ITEM", "TYPE", "STATUS", "MODIFIED", "ACTIONS"]}
      >
        {landingBlocks.map((item) => {
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
                  <Link href={`/admin/content/${CONTENT_BLOCK_SLUGS[item.type as keyof typeof CONTENT_BLOCK_SLUGS] ?? item.id}/edit`} className="p-2 text-[var(--ms-text-secondary)] hover:text-[#8B5CF6]">
                    <Pencil size={16} />
                  </Link>
                  <Link href="/" className="p-2 text-[var(--ms-text-secondary)] hover:text-[#22D3EE]">
                    <Eye size={16} />
                  </Link>
                </div>
              </td>
            </tr>
          );
        })}
      </AdminDataTable>
    </div>
  );
}
