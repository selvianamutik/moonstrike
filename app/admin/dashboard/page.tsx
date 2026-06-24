import { DashboardClient } from "@/app/admin/dashboard/DashboardClient";
import { getAdminDashboardData } from "@/lib/admin/dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDashboard() {
  const dashboard = await getAdminDashboardData(30);

  return <DashboardClient initialDashboard={dashboard} />;
}
