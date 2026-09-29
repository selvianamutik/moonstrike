import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { AdminVoucherManager } from "../content/voucher-manager";

export default async function AdminVouchersPage() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin/login?next=/admin/vouchers");
  }

  return <AdminVoucherManager />;
}
