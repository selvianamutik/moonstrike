import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/lib/admin/audit";
import { getAdminSession } from "@/lib/admin/session";
import { CMS_MEDIA_BUCKET, getStoragePathFromPublicUrl } from "@/lib/cms/storage";
import { MAX_VISIBLE_HERO_BANNERS, heroBannerPayload, normalizeHeroBannerInput, HERO_BANNER_SELECT } from "@/lib/cms/hero-banners";
import { createAdminClient } from "@/lib/supabase/admin";

function storagePath(value: string | null | undefined) {
  if (!value) return null;
  return getStoragePathFromPublicUrl(value) ?? value;
}

async function cleanupReplacedMedia(paths: string[]) {
  if (paths.length === 0) return;

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(CMS_MEDIA_BUCKET).remove(Array.from(new Set(paths)));

  if (error) {
    console.error("Failed to remove replaced hero banner media", error.message);
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Try slug first, then fall back to id (id is UUID so can't mix in .or() with text)
  let { data, error } = await supabase
    .from("hero_banners")
    .select(HERO_BANNER_SELECT)
    .eq("slug", id)
    .maybeSingle();

  if (!data && !error) {
    ({ data, error } = await supabase
      .from("hero_banners")
      .select(HERO_BANNER_SELECT)
      .eq("id", id)
      .maybeSingle());
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Hero banner not found." }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const input = normalizeHeroBannerInput(await request.json().catch(() => null));

  if (!input.title || !input.description || !input.image) {
    return NextResponse.json({ error: "Title, description, and image are required." }, { status: 400 });
  }

  if (input.status === "scheduled" && !input.startsAt) {
    return NextResponse.json({ error: "Scheduled banners need a start date." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Look up by slug first, then fall back to id (id is UUID so can't mix in .or() with text)
  let { data: existing, error: lookupError } = await supabase
    .from("hero_banners")
    .select("id, title, image, thumbnail, storage_path, thumbnail_path")
    .eq("slug", id)
    .maybeSingle<{ id: string; title: string; image: string; thumbnail: string; storage_path: string; thumbnail_path: string }>();

  if (!existing && !lookupError) {
    ({ data: existing, error: lookupError } = await supabase
      .from("hero_banners")
      .select("id, title, image, thumbnail, storage_path, thumbnail_path")
      .eq("id", id)
      .maybeSingle<{ id: string; title: string; image: string; thumbnail: string; storage_path: string; thumbnail_path: string }>());
  }

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "Hero banner not found." }, { status: 404 });
  }

  if (input.status === "active" || input.status === "scheduled") {
    const { count, error: countError } = await supabase
      .from("hero_banners")
      .select("id", { count: "exact", head: true })
      .in("status", ["active", "scheduled"])
      .neq("id", existing.id);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if ((count ?? 0) >= MAX_VISIBLE_HERO_BANNERS) {
      return NextResponse.json({ error: `Only ${MAX_VISIBLE_HERO_BANNERS} active or scheduled hero banners are allowed. Draft or archive one before activating this content.` }, { status: 400 });
    }
  }

  const { error } = await supabase.from("hero_banners").update(heroBannerPayload(input)).eq("id", existing.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const replacedPaths = [existing.image, existing.thumbnail, existing.storage_path, existing.thumbnail_path]
    .filter((value) => value && value !== input.image && value !== input.thumbnail && value !== input.storagePath && value !== input.thumbnailPath)
    .map(storagePath)
    .filter((value): value is string => Boolean(value));

  await cleanupReplacedMedia(replacedPaths);

  await writeAuditLog({
    action: `Updated landing hero banner: ${input.title}`,
    status: "success",
    request,
    admin,
    eventType: "cms",
  });

  revalidatePath("/");
  revalidatePath("/admin/content");

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  let { data: existing, error: lookupError } = await supabase
    .from("hero_banners")
    .select("id, title, image, thumbnail, storage_path, thumbnail_path")
    .eq("slug", id)
    .maybeSingle<{ id: string; title: string; image: string; thumbnail: string; storage_path: string; thumbnail_path: string }>();

  if (!existing && !lookupError) {
    ({ data: existing, error: lookupError } = await supabase
      .from("hero_banners")
      .select("id, title, image, thumbnail, storage_path, thumbnail_path")
      .eq("id", id)
      .maybeSingle<{ id: string; title: string; image: string; thumbnail: string; storage_path: string; thumbnail_path: string }>());
  }

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "Hero banner not found." }, { status: 404 });
  }

  const { error } = await supabase.from("hero_banners").delete().eq("id", existing.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const paths = [existing.image, existing.thumbnail, existing.storage_path, existing.thumbnail_path]
    .map(storagePath)
    .filter((value): value is string => Boolean(value));

  await cleanupReplacedMedia(paths);

  await writeAuditLog({
    action: `Deleted landing hero banner: ${existing.title}`,
    status: "success",
    request,
    admin,
    eventType: "cms",
  });

  revalidatePath("/");
  revalidatePath("/admin/content");

  return NextResponse.json({ ok: true });
}
