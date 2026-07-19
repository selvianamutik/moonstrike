import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/lib/admin/audit";
import { getAdminSession } from "@/lib/admin/session";
import { MAX_VISIBLE_HERO_BANNERS, heroBannerPayload, normalizeHeroBannerInput } from "@/lib/cms/hero-banners";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const admin = await getAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const input = normalizeHeroBannerInput(await request.json().catch(() => null));

  if (!input.title || !input.description || !input.image) {
    return NextResponse.json({ error: "Title, description, and image are required." }, { status: 400 });
  }

  if (input.status === "scheduled" && !input.startsAt) {
    return NextResponse.json({ error: "Scheduled banners need a start date." }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (input.status === "active" || input.status === "scheduled") {
    const { count, error: countError } = await supabase
      .from("hero_banners")
      .select("id", { count: "exact", head: true })
      .in("status", ["active", "scheduled"]);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if ((count ?? 0) >= MAX_VISIBLE_HERO_BANNERS) {
      return NextResponse.json({ error: `Only ${MAX_VISIBLE_HERO_BANNERS} active or scheduled hero banners are allowed. Draft or archive one before adding another.` }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("hero_banners")
    .insert({
      ...heroBannerPayload(input),
      created_by: admin.id,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAuditLog({
    action: `Created landing hero banner: ${input.title}`,
    status: "success",
    request,
    admin,
    eventType: "cms",
  });

  revalidatePath("/");
  revalidatePath("/admin/content");

  return NextResponse.json({ banner: data });
}
