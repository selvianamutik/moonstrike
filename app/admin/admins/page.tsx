import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { listAdminUsers, getRolePermissions } from "@/lib/admin/admin-users";
import { AdminsPageClient } from "./AdminsPageClient";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login?next=/admin/admins");

  const [admins, rolePermissions] = await Promise.all([
    listAdminUsers(),
    getRolePermissions(),
  ]);

  const isSuperAdmin = admin.role === "super_admin";

  return (
    <AdminsPageClient
      admins={admins}
      currentAdminId={admin.id}
      isSuperAdmin={isSuperAdmin}
      initialRolePermissions={rolePermissions}
    />
  );
}
