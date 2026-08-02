import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { getRolePermissions } from "@/lib/admin/admin-users";
import { LivePageRefresh } from "@/components/live-page-refresh";
import { listAdminTransactions } from "@/lib/admin/transactions";
import { TransactionsPageClient } from "./TransactionsPageClient";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login?next=/admin/transactions");

  // Check permission — super_admin always has access, others check role_permissions table
  if (admin.role !== "super_admin") {
    const rolePerms = await getRolePermissions();
    const found = rolePerms.find((rp) => rp.role === admin.role);
    const hasPermission = found?.permissions.includes("transactions") ?? false;
    if (!hasPermission) redirect("/admin/dashboard?error=unauthorized");
  }

  const { records, stats } = await listAdminTransactions();

  return (
    <>
      <LivePageRefresh intervalMs={10_000} />
      <TransactionsPageClient stats={stats} transactions={records} adminRole={admin.role} />
    </>
  );
}
