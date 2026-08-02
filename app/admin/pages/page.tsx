import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { getRolePermissions } from "@/lib/admin/admin-users";
import { listCustomPages } from "@/lib/admin/custom-pages";
import { PagesPageClient } from "./PagesPageClient";

export const dynamic = "force-dynamic";

export default async function PagesPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login?next=/admin/pages");

  // Check permission — super_admin always has access, others check role_permissions table
  if (admin.role !== "super_admin") {
    const rolePerms = await getRolePermissions();
    const found = rolePerms.find((rp) => rp.role === admin.role);
    const hasPermission = found?.permissions.includes("pages") ?? false;
    if (!hasPermission) redirect("/admin/dashboard?error=unauthorized");
  }

  const pages = await listCustomPages();
  return <PagesPageClient pages={pages} />;
}
