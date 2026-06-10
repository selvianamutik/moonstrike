import { listAdminCustomers } from "@/lib/admin/users";
import { UsersPageClient } from "./UsersPageClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const { customers, stats } = await listAdminCustomers();
  return <UsersPageClient customers={customers} stats={stats} />;
}
