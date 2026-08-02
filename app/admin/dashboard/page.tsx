import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { DashboardClient } from "@/app/admin/dashboard/DashboardClient";
import { getAdminDashboardData } from "@/lib/admin/dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDashboard() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login?next=/admin/dashboard");

  const dashboard = await getAdminDashboardData(30);

  return <DashboardClient initialDashboard={dashboard} adminRole={admin.role} />;
}
