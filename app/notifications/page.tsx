import { NotificationsFeed } from "@/components/notifications-feed";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth/session";
import { listNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser("/notifications");
  const notifications = await listNotifications("customer", user.id, 50);

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />
      <section className="ms-shell py-16">
        <div className="mb-8 border-b border-[var(--ms-border)] pb-7">
          <p className="mono text-xs uppercase tracking-[0.28em] text-[var(--ms-gradient-end)]">Customer Dashboard</p>
          <h1 className="font-display mt-3 text-4xl font-black tracking-[-0.05em]">Notifications</h1>
          <p className="mt-3 max-w-2xl text-sm text-[var(--ms-body)]">Order, delivery, completion, and refund updates for your account.</p>
        </div>

        <NotificationsFeed mode="customer" initialNotifications={notifications} />
      </section>
      <SiteFooter />
    </main>
  );
}
