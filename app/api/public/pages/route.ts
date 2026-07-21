import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "page";

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("custom_pages")
    .select("id, title, slug, category")
    .eq("category", category)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[api/public/pages] supabase error:", error);
    return Response.json([]);
  }

  return Response.json(data ?? []);
}
