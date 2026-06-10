import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { ProfileTransactionsList } from "@/components/profile/ProfileTransactionsList";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireVerifiedUser } from "@/lib/auth/session";
import { formatMemberSince, getUserDisplayName, getUserInitials } from "@/lib/auth/user-display";
import { formatOrderMoney, listCustomerOrders, type CustomerOrder } from "@/lib/orders";
import { listCustomerTransactions } from "@/lib/transactions";

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

export default async function ProfileTransactionsPage() {
  const user = await requireVerifiedUser("/profile/transactions");
  const [orders, transactions] = await Promise.all([listCustomerOrders(user.id), listCustomerTransactions(user.id)]);
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
            <h1 className="font-display mt-3 text-4xl font-black tracking-[-0.05em]">Transactions</h1>
          </div>

          <ProfileTransactionsList transactions={transactions} />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
