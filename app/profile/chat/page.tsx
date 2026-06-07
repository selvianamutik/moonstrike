import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireVerifiedUser } from "@/lib/auth/session";
import { formatMemberSince, getUserDisplayName, getUserInitials } from "@/lib/auth/user-display";
import { formatOrderMoney, listCustomerOrders, type CustomerOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

function formatTotalSpent(orders: CustomerOrder[]) {
  const totals = orders.reduce(
    (sum, order) => {
      sum[order.currency] += order.total;
      return sum;
    },
    { USD: 0, EUR: 0 },
  );

  const parts = [];
  if (totals.USD > 0) parts.push(formatOrderMoney(totals.USD, "USD"));
  if (totals.EUR > 0) parts.push(formatOrderMoney(totals.EUR, "EUR"));
  return parts.length > 0 ? parts.join(" / ") : "$0.00";
}

export default async function ProfileChatPage() {
  const user = await requireVerifiedUser("/profile/chat");
  const orders = await listCustomerOrders(user.id);
  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(displayName, user.email);
  const memberSince = formatMemberSince(user.created_at);

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />
      <section className="ms-shell grid gap-8 py-16 lg:grid-cols-[270px_minmax(0,1fr)]">
        <ProfileSidebar
          displayName={displayName}
          email={user.email}
          initials={initials}
          memberSince={memberSince}
          totalOrders={orders.length}
          totalSpent={formatTotalSpent(orders)}
        />

        <div>
          <div className="border-b border-[var(--ms-border)] pb-7">
            <p className="mono text-xs uppercase tracking-[0.28em] text-[var(--ms-gradient-end)]">Customer Dashboard</p>
            <h1 className="font-display mt-3 text-4xl font-black tracking-[-0.05em]">Chat</h1>
          </div>

          <section className="mt-8 rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-[var(--ms-gradient-end)] bg-[var(--ms-hover-bg)] text-[var(--ms-gradient-end)]">
              <MessageSquare size={24} />
            </div>
            <h2 className="mt-6 text-2xl font-black">Customer chat</h2>
            <p className="mt-3 max-w-2xl leading-7 text-[var(--ms-body)]">
              Chat is the place for order updates, delivery questions, booster coordination, and refund requests.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/profile/orders" className="ms-button flex h-11 items-center justify-center px-5 mono text-xs uppercase tracking-[0.14em]">
                Choose Order
              </Link>
              <Link href="/refund-policy" className="flex h-11 items-center justify-center rounded-md border border-[var(--ms-border)] px-5 mono text-xs uppercase tracking-[0.14em] text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-heading)]">
                Refund Policy
              </Link>
            </div>
          </section>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
