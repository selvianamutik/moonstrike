import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing service id." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: service, error } = await supabase
    .from("services")
    .select(
      "id, title, slug, image, base_price_usd, base_price_eur, options_schema, status, games(name, slug), service_categories(slug)"
    )
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!service) {
    return NextResponse.json({ error: "Service not found." }, { status: 404 });
  }

  const game = Array.isArray(service.games) ? service.games[0] : service.games;
  const category = Array.isArray(service.service_categories)
    ? service.service_categories[0]
    : service.service_categories;

  return NextResponse.json({
    id: service.id,
    title: service.title,
    slug: service.slug,
    image: service.image,
    basePriceUSD: Number(service.base_price_usd),
    basePriceEUR: Number(service.base_price_eur),
    optionsSchema: Array.isArray(service.options_schema) ? service.options_schema : [],
    gameSlug: game?.slug ?? "",
    serviceCategorySlug: category?.slug ?? null,
  });
}