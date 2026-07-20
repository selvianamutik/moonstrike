import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { listCustomPages } from "@/lib/admin/custom-pages";
import { PagesPageClient } from "./PagesPageClient";

export const dynamic = "force-dynamic";

export default async function PagesPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login?next=/admin/pages");

  const pages = await listCustomPages();
  return <PagesPageClient pages={pages} />;
}
