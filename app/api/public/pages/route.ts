import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "page";

  const supabase = await createClient();
  const { data } = await supabase
    .from("custom_pages")
    .select("id, title, slug, category")
    .eq("category", category)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return Response.json(data ?? []);
}
