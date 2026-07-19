"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ImagePlus, Pencil, Trash2 } from "lucide-react";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { StatusBadge, type StatusType } from "@/components/admin/StatusBadge";
import { ActionTooltip } from "@/components/common/ActionTooltip";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import type { HeroBannerRow, HeroBannerStatus } from "@/lib/cms/hero-banners";
import {
  CONTENT_BLOCK_SLUGS,
  normalizeLandingBenefitsData,
  normalizeLandingStepsData,
  type ContentBlockRow,
} from "@/lib/cms/landing";

function effectiveStatus(banner: HeroBannerRow): HeroBannerStatus {
  if (banner.status === "active") return "active";
  if (banner.status === "scheduled") {
    const now = new Date().toISOString();
    if (banner.starts_at && banner.starts_at <= now && (!banner.ends_at || banner.ends_at > now)) return "active";
    if (banner.ends_at && banner.ends_at <= now) return "archived";
  }
  return banner.status;
}

function effectiveStatusForBlock(block: ContentBlockRow): ContentBlockRow["status"] {
  if (block.status === "active") return "active";
  if (block.status === "scheduled") {
    const now = new Date().toISOString();
    if (block.scheduled_at && block.scheduled_at <= now) return "active";
  }
  return block.status;
}

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

type CombinedContentItem =
  | { kind: "hero_banner"; id: string; title: string; description: string; image: string; status: HeroBannerStatus; scheduleStart: string; scheduleEnd: string; updatedAt: string; banner: HeroBannerRow }
  | { kind: "benefits_section"; id: string; title: string; description: string; image: string; status: ContentBlockRow["status"]; scheduleStart: string; scheduleEnd: string; updatedAt: string; block: ContentBlockRow }
  | { kind: "steps_section"; id: string; title: string; description: string; image: string; status: ContentBlockRow["status"]; scheduleStart: string; scheduleEnd: string; updatedAt: string; block: ContentBlockRow };

export function HeroBannersManager({
  initialBanners,
  landingBlocks,
}: {
  initialBanners: HeroBannerRow[];
  landingBlocks: ContentBlockRow[];
}) {
  const [banners, setBanners] = useState(initialBanners);
  const [deleteBannerTarget, setDeleteBannerTarget] = useState<HeroBannerRow | null>(null);
  const [deleteBlockTarget, setDeleteBlockTarget] = useState<ContentBlockRow | null>(null);

  const combinedItems = useMemo<CombinedContentItem[]>(() => {
    const heroItems = banners.map((banner) => ({
      kind: "hero_banner" as const,
      id: banner.id,
      title: banner.title,
      description: banner.description,
      image: banner.thumbnail || banner.image,
      status: effectiveStatus(banner),
      scheduleStart: banner.status === "scheduled" ? formatDate(banner.starts_at) : "Immediately",
      scheduleEnd: formatDate(banner.ends_at),
      updatedAt: banner.updated_at,
      banner,
    }));
    const blockItems = landingBlocks.map((block) => {
      const benefits = block.type === "benefits_section" ? normalizeLandingBenefitsData(block.data) : null;
      const isSteps = block.type === "steps_section";
      const stepsData = isSteps ? normalizeLandingStepsData(block.data) : null;

      return {
        kind: isSteps ? "steps_section" as const : "benefits_section" as const,
        id: block.id,
        title: benefits?.title ?? stepsData?.title ?? block.name,
        description: block.type === "benefits_section" ? `${benefits?.items.length ?? 0} benefit cards` : `${stepsData?.items.length ?? 0} steps`,
        image: block.thumbnail ?? benefits?.thumbnailUrl ?? "",
        status: effectiveStatusForBlock(block),
        scheduleStart: block.scheduled_at ? formatDate(block.scheduled_at) : "Immediately",
        scheduleEnd: "Never expires",
        updatedAt: block.modified_at,
        block,
      };
    }).filter((item) => item.block.type === "benefits_section" || item.block.type === "steps_section");

    return [...heroItems, ...blockItems].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [banners, landingBlocks]);

  async function deleteBanner() {
    if (!deleteBannerTarget) return;

    const response = await fetch(`/api/admin/hero-banners/${deleteBannerTarget.slug || deleteBannerTarget.id}`, { method: "DELETE" });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) return;
    setBanners((current) => current.filter((banner) => banner.id !== deleteBannerTarget.id));
    setDeleteBannerTarget(null);
  }

  async function deleteBlock() {
    if (!deleteBlockTarget) return;

    const response = await fetch(`/api/admin/content/${deleteBlockTarget.id}`, { method: "DELETE" });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) return;
    // Refresh the page to update the list
    window.location.reload();
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminDataTable
        title="Landing content"
        headerAction={
          <AdminButton onClick={() => { window.location.href = "/admin/content/new"; }}>
            Add Content
          </AdminButton>
        }
        columns={["CONTENT", "TYPE", "STATUS", "SCHEDULE START", "SCHEDULE END", "ACTIONS"]}
      >
        {combinedItems.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-6 py-10 text-center text-sm text-[var(--admin-muted)]">
              No landing content yet.
            </td>
          </tr>
        ) : (
          combinedItems.map((item) => (
            <tr key={`${item.kind}-${item.id}`} className="transition-colors hover:bg-[#111827]">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  {item.image ? (
                    <img src={item.image} alt="" className="h-12 w-20 rounded object-cover" />
                  ) : (
                    <div className="flex h-12 w-20 items-center justify-center rounded bg-[var(--admin-border)] text-[var(--admin-muted)]">
                      <ImagePlus size={16} />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-white">{item.title}</div>
                    <div className="mt-1 line-clamp-1 text-xs text-[#64748B]">{item.description}</div>
                    {item.kind === "hero_banner" && item.banner.badges.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.banner.badges.slice(0, 3).map((badge) => (
                          <span key={badge} className="rounded border border-[#8B5CF6]/30 px-2 py-0.5 text-[10px] uppercase text-[#C4B5FD]">
                            {badge}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-[var(--admin-muted)]">
                {item.kind === "hero_banner" ? "Hero banner" : item.kind === "steps_section" ? "How It Works" : "Benefits"}
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={item.status as StatusType} />
              </td>
              <td className="px-6 py-4 text-xs">{item.scheduleStart}</td>
              <td className="px-6 py-4 text-xs">{item.scheduleEnd}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1">
                  <ActionTooltip label="Edit">
                    {item.kind === "hero_banner" ? (
                      <Link
                        href={`/admin/content/${item.banner.slug}/edit-banner`}
                        className="admin-action-icon hover:border-[#8B5CF6] hover:text-[#8B5CF6]"
                        aria-label={`Edit ${item.title}`}
                      >
                        <Pencil size={16} />
                      </Link>
                    ) : (
                      <Link
                        href={`/admin/content/${item.kind === "benefits_section" ? CONTENT_BLOCK_SLUGS.benefits_section : CONTENT_BLOCK_SLUGS.steps_section}/edit`}
                        className="admin-action-icon hover:border-[#8B5CF6] hover:text-[#8B5CF6]"
                        aria-label={`Edit ${item.title}`}
                      >
                        <Pencil size={16} />
                      </Link>
                    )}
                  </ActionTooltip>
                  <ActionTooltip label="Delete">
                    {item.kind === "hero_banner" ? (
                      <button
                        type="button"
                        onClick={() => setDeleteBannerTarget(item.banner)}
                        className="admin-action-icon hover:border-red-500 hover:text-red-400"
                        aria-label={`Delete ${item.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteBlockTarget(item.block)}
                        className="admin-action-icon hover:border-red-500 hover:text-red-400"
                        aria-label={`Delete ${item.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </ActionTooltip>
                </div>
              </td>
            </tr>
          ))
        )}
      </AdminDataTable>

      <ConfirmDialog
        open={Boolean(deleteBannerTarget)}
        title="Delete hero banner?"
        description={deleteBannerTarget ? `This removes ${deleteBannerTarget.title} and its uploaded banner images.` : ""}
        confirmLabel="Delete Banner"
        variant="danger"
        onClose={() => setDeleteBannerTarget(null)}
        onConfirm={deleteBanner}
      />

      <ConfirmDialog
        open={Boolean(deleteBlockTarget)}
        title={`Delete ${deleteBlockTarget?.type === "benefits_section" ? "Benefits" : "How It Works"} section?`}
        description="This removes the content section and its associated images. This action cannot be undone."
        confirmLabel="Delete Section"
        variant="danger"
        onClose={() => setDeleteBlockTarget(null)}
        onConfirm={deleteBlock}
      />
    </div>
  );
}