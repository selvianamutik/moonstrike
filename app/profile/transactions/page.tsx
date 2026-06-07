import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireVerifiedUser } from "@/lib/auth/session";
import { formatMemberSince, getUserDisplayName, getUserInitials } from "@/lib/auth/user-display";
import { formatOrderDate, formatOrderMoney, listCustomerOrders, type CustomerOrder } from "@/lib/orders";
import { formatTransactionMoney, listCustomerTransactions } from "@/lib/transactions";

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

          <section className="mt-8 overflow-hidden rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)]">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-4 border-b border-[var(--ms-border)] px-5 py-4 mono text-xs uppercase tracking-[0.16em] text-[var(--ms-body)] md:grid-cols-[1.3fr_1fr_1fr_1fr_1fr_auto]">
              <span>Transaction ID</span>
              <span className="hidden md:block">Provider</span>
              <span>Date</span>
              <span>Amount</span>
              <span className="hidden md:block">Status</span>
              <span className="text-right">Action</span>
            </div>
            {transactions.length === 0 ? (
              <div className="px-5 py-6 text-sm text-[var(--ms-body)]">No transactions yet.</div>
            ) : (
              transactions.map((transaction) => (
                <div key={transaction.id} className="grid grid-cols-[1fr_1fr_auto] items-center gap-4 border-b border-[var(--ms-border)] px-5 py-4 text-sm last:border-0 md:grid-cols-[1.3fr_1fr_1fr_1fr_1fr_auto]">
                  <span className="mono truncate">{transaction.id}</span>
                  <span className="hidden md:block">{transaction.method}</span>
                  <span>{formatOrderDate(transaction.createdAt)}</span>
                  <span className="mono text-[var(--ms-price)]">{formatTransactionMoney(transaction.amount, transaction.currency)}</span>
                  <span className="hidden text-[var(--ms-success)] md:block">{transaction.status.replace("_", " ")}</span>
                  <Link href={`/profile/transactions/${transaction.id}`} className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--ms-border)] px-3 text-xs text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-heading)]">
                    Detail
                  </Link>
                </div>
              ))
            )}
          </section>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
