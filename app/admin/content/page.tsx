import React from "react";
import { redirect } from "next/navigation";
import { CalendarClock, FileText, ImageOff, Layers3 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { getAdminSession } from "@/lib/admin/session";
import {
  ensureLandingBenefitsBlock,
  ensureLandingHeroBlock,
  listAdminContentBlocks,
} from "@/lib/cms/landing";
import { ContentPageClient } from "./ContentPageClient";

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
  const activeCount = landingBlocks.filter((block) => block.status === "active").length;
  const draftCount = landingBlocks.filter((block) => block.status === "draft").length;
  const scheduledCount = landingBlocks.filter((block) => block.scheduled_at).length;
  const missingThumbnailCount = landingBlocks.filter((block) => !block.thumbnail).length;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <AdminPageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Content", active: true }]}
        title="Content Library"
        description="Landing hero and Why Choose Us are backed by Supabase content_blocks and rendered on the storefront."
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard title="CMS BLOCKS" value={String(landingBlocks.length)} subtitle="Landing sections" icon={<Layers3 size={18} className="text-[#8B5CF6]" />} progressColor="bg-[#8B5CF6]" progressWidth="w-[65%]" />
        <AdminStatCard title="ACTIVE" value={String(activeCount)} subtitle="Visible on storefront" icon={<FileText size={18} className="text-green-500" />} progressColor="bg-green-500" progressWidth="w-[60%]" />
        <AdminStatCard title="SCHEDULED" value={String(scheduledCount)} subtitle="Queued content" icon={<CalendarClock size={18} className="text-[#22D3EE]" />} progressColor="bg-[#22D3EE]" progressWidth="w-[30%]" />
        <AdminStatCard title="MISSING THUMBNAILS" value={String(missingThumbnailCount)} subtitle="Needs media cleanup" icon={<ImageOff size={18} className="text-amber-500" />} progressColor="bg-amber-500" progressWidth="w-[25%]" />
      </div>

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

      <ContentPageClient landingBlocks={landingBlocks} />
    </div>
  );
}
