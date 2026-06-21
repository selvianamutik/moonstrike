import { redirect } from "next/navigation";
import { NotificationsFeed } from "@/components/notifications-feed";
import { getAdminSession } from "@/lib/admin/session";
import { listNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");

  const notifications = await listNotifications("admin", admin.id, 50);

  return (
    <div className="space-y-8">
      <div className="border-b border-[var(--ms-accent)] pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#22D3EE]">Admin Terminal</p>
        <h1 className="mt-3 text-3xl font-black text-white">Notifications</h1>
        <p className="mt-2 text-sm text-[#94A3B8]">Operational alerts for new orders, refund requests, and completed orders.</p>
      </div>

      <NotificationsFeed mode="admin" initialNotifications={notifications} />
    </div>
  );
}
