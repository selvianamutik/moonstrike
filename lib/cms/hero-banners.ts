import { createAdminClient } from "@/lib/supabase/admin";
import type { LandingHeroData } from "@/lib/cms/landing";

export type HeroBannerStatus = "active" | "scheduled" | "draft" | "archived";
export type HeroBannerCtaType = "game" | "service" | "custom";

export type HeroBannerRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  thumbnail: string;
  storage_path: string;
  thumbnail_path: string;
  badges: string[];
  cta_label: string;
  cta_type: HeroBannerCtaType;
  cta_href: string;
  cta_title: string;
  cta_meta: string;
  status: HeroBannerStatus;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type HeroBannerInput = {
  slug?: string;
  title: string;
  description: string;
  image: string;
  thumbnail: string;
  storagePath: string;
  thumbnailPath: string;
  badges: string[];
  ctaLabel: string;
  ctaType: HeroBannerCtaType;
  ctaHref: string;
  ctaTitle: string;
  ctaMeta: string;
  status: HeroBannerStatus;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
};

export const HERO_BANNER_SELECT =
  "id, slug, title, description, image, thumbnail, storage_path, thumbnail_path, badges, cta_label, cta_type, cta_href, cta_title, cta_meta, status, sort_order, starts_at, ends_at, created_by, created_at, updated_at";

export const MAX_VISIBLE_HERO_BANNERS = 5;

export function heroBannerToHeroSlide(row: HeroBannerRow): LandingHeroData {
  return {
    label: row.badges[0] ?? "Featured Recommended",
    headline: row.title,
    subtext: row.description,
    ctaText: row.cta_label,
    ctaHref: row.cta_href,
    badgeVariant: "featured",
    badges: row.badges,
    imageUrl: row.image,
    thumbnailUrl: row.thumbnail,
    storagePath: row.storage_path,
    thumbnailPath: row.thumbnail_path,
  };
}

export async function listAdminHeroBanners() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("hero_banners")
    .select(HERO_BANNER_SELECT)
    .order("updated_at", { ascending: false })
    .returns<HeroBannerRow[]>();

  if (error) throw error;
  return data ?? [];
}

export async function getAdminHeroBanner(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("hero_banners")
    .select(HERO_BANNER_SELECT)
    .eq("id", id)
    .maybeSingle<HeroBannerRow>();

  if (error) throw error;
  return data;
}

export async function listActiveHeroBanners() {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("hero_banners")
    .select(HERO_BANNER_SELECT)
    .in("status", ["active", "scheduled"])
    .order("updated_at", { ascending: false })
    .returns<HeroBannerRow[]>();

  if (error) throw error;
  return (data ?? []).filter((banner) => {
    const hasStarted =
      banner.status === "active"
        ? !banner.starts_at || banner.starts_at <= now
        : Boolean(banner.starts_at && banner.starts_at <= now);
    const hasNotEnded = !banner.ends_at || banner.ends_at > now;
    return hasStarted && hasNotEnded;
  });
}

export async function tickHeroBannerStatusTransitions() {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // scheduled -> active: past starts_at
  const { data: shouldActivate } = await supabase
    .from("hero_banners")
    .select("id, title")
    .eq("status", "scheduled")
    .lte("starts_at", now)
    .returns<{ id: string; title: string }[]>();

  // active/scheduled -> archived: past ends_at
  const { data: shouldArchive } = await supabase
    .from("hero_banners")
    .select("id, title")
    .in("status", ["active", "scheduled"])
    .not("ends_at", "is", null)
    .lte("ends_at", now)
    .returns<{ id: string; title: string }[]>();

  const results = { activated: 0, archived: 0, errors: 0 };

  if (shouldActivate && shouldActivate.length > 0) {
    const { error } = await supabase
      .from("hero_banners")
      .update({ status: "active", updated_at: now })
      .in("id", shouldActivate.map((r) => r.id));
    if (error) { console.error("Failed to activate hero banners:", error.message); results.errors++; }
    else results.activated = shouldActivate.length;
  }

  if (shouldArchive && shouldArchive.length > 0) {
    const { error } = await supabase
      .from("hero_banners")
      .update({ status: "archived", updated_at: now })
      .in("id", shouldArchive.map((r) => r.id));
    if (error) { console.error("Failed to archive hero banners:", error.message); results.errors++; }
    else results.archived = shouldArchive.length;
  }

  return results;
}

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function normalizeHeroBannerInput(value: unknown): HeroBannerInput {
  const body = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const status = body.status;
  const ctaType = body.ctaType;
  const sortOrder = Number(body.sortOrder);
  const badges = Array.isArray(body.badges)
    ? body.badges.map((badge) => (typeof badge === "string" ? badge.trim() : "")).filter(Boolean).slice(0, 5)
    : [];

  return {
    slug: typeof body.slug === "string" && body.slug.trim() ? slugify(body.slug.trim()) : undefined,
    title: typeof body.title === "string" ? body.title.trim() : "",
    description: typeof body.description === "string" ? body.description.trim() : "",
    image: typeof body.image === "string" ? body.image.trim() : "",
    thumbnail: typeof body.thumbnail === "string" ? body.thumbnail.trim() : "",
    storagePath: typeof body.storagePath === "string" ? body.storagePath.trim() : "",
    thumbnailPath: typeof body.thumbnailPath === "string" ? body.thumbnailPath.trim() : "",
    badges,
    ctaLabel: typeof body.ctaLabel === "string" && body.ctaLabel.trim() ? body.ctaLabel.trim() : "View Details",
    ctaType: ctaType === "game" || ctaType === "service" || ctaType === "custom" ? ctaType : "custom",
    ctaHref: typeof body.ctaHref === "string" && body.ctaHref.trim() ? body.ctaHref.trim() : "/games",
    ctaTitle: typeof body.ctaTitle === "string" ? body.ctaTitle.trim() : "",
    ctaMeta: typeof body.ctaMeta === "string" ? body.ctaMeta.trim() : "",
    status: status === "active" || status === "scheduled" || status === "archived" || status === "draft" ? status : "draft",
    sortOrder: Number.isFinite(sortOrder) ? Math.floor(sortOrder) : 0,
    startsAt: typeof body.startsAt === "string" && body.startsAt.trim() ? body.startsAt : null,
    endsAt: typeof body.endsAt === "string" && body.endsAt.trim() ? body.endsAt : null,
  };
}

export function heroBannerPayload(input: HeroBannerInput) {
  return {
    slug: input.slug ?? slugify(input.title),
    title: input.title,
    description: input.description,
    image: input.image,
    thumbnail: input.thumbnail,
    storage_path: input.storagePath,
    thumbnail_path: input.thumbnailPath,
    badges: input.badges,
    cta_label: input.ctaLabel,
    cta_type: input.ctaType,
    cta_href: input.ctaHref,
    cta_title: input.ctaTitle,
    cta_meta: input.ctaMeta,
    status: input.status,
    sort_order: input.sortOrder,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    updated_at: new Date().toISOString(),
  };
}
