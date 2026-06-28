import { redirect } from "next/navigation";
import { CalendarClock, FileText, ImageOff, Layers3 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { getAdminSession } from "@/lib/admin/session";
import {
  ensureLandingBenefitsBlock,
  ensureLandingHeroBlock,
  ensureLandingStepsBlock,
  listAdminContentBlocks,
} from "@/lib/cms/landing";
import { listAdminHeroBanners } from "@/lib/cms/hero-banners";
import { HeroBannersManager } from "./HeroBannersManager";

export default async function ContentPage() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin/login?next=/admin/content");
  }

  await Promise.all([
    ensureLandingHeroBlock(admin.id),
    ensureLandingBenefitsBlock(admin.id),
    ensureLandingStepsBlock(admin.id),
  ]);
  const [blocks, heroBanners] = await Promise.all([
    listAdminContentBlocks(),
    listAdminHeroBanners(),
  ]);
  const landingBlocks = blocks.filter((block) => block.type === "hero" || block.type === "benefits_section");
  const contentItemsCount = landingBlocks.length + heroBanners.length;
  const now = new Date().toISOString();
  const activeBannersCount = heroBanners.filter((banner) =>
    banner.status === "active" ||
    (banner.status === "scheduled" && banner.starts_at && banner.starts_at <= now && (!banner.ends_at || banner.ends_at > now))
  ).length;
  const activeCount = landingBlocks.filter((block) => block.status === "active").length + activeBannersCount;
  const scheduledCount = landingBlocks.filter((block) => block.scheduled_at || block.status === "scheduled").length + heroBanners.filter((banner) => banner.status === "scheduled" || banner.starts_at).length;
  const missingThumbnailCount = landingBlocks.filter((block) => !block.thumbnail).length + heroBanners.filter((banner) => !banner.thumbnail).length;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <AdminPageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Content", active: true }]}
        title="Content Library"
        description="Landing hero banners and Why Choose Us are backed by Supabase CMS records and rendered on the storefront."
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard title="CMS ITEMS" value={String(contentItemsCount)} subtitle="Landing content" icon={<Layers3 size={18} className="text-[#8B5CF6]" />} progressColor="bg-[#8B5CF6]" progressWidth="w-[65%]" />
        <AdminStatCard title="ACTIVE" value={String(activeCount)} subtitle="Visible on storefront" icon={<FileText size={18} className="text-green-500" />} progressColor="bg-green-500" progressWidth="w-[60%]" />
        <AdminStatCard title="SCHEDULED" value={String(scheduledCount)} subtitle="Queued content" icon={<CalendarClock size={18} className="text-[#22D3EE]" />} progressColor="bg-[#22D3EE]" progressWidth="w-[30%]" />
        <AdminStatCard title="MISSING THUMBNAILS" value={String(missingThumbnailCount)} subtitle="Needs media cleanup" icon={<ImageOff size={18} className="text-amber-500" />} progressColor="bg-amber-500" progressWidth="w-[25%]" />
      </div>

      <HeroBannersManager initialBanners={heroBanners} landingBlocks={landingBlocks} />
    </div>
  );
}
