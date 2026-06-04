import Link from "next/link";
import { PlaceholderAsset } from "@/components/asset-image";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireVerifiedUser } from "@/lib/auth/session";
import { formatMemberSince, getUserDisplayName, getUserInitials } from "@/lib/auth/user-display";
import { formatOrderDate, formatOrderMoney, listCustomerOrders, type CustomerOrder } from "@/lib/orders";

const filters = ["All", "Pending", "Confirmed", "In Progress", "Delivered", "Completed", "Refund Requested", "Refunded"];

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

export default async function ProfileOrdersPage() {
  const user = await requireVerifiedUser("/profile/orders");
  const orders = await listCustomerOrders(user.id);
  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(displayName, user.email);
  const memberSince = formatMemberSince(user.created_at);

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />
      <section className="ms-shell grid gap-10 py-16 lg:grid-cols-[300px_1fr]">
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
            <h1 className="font-display mt-3 text-4xl font-black tracking-[-0.05em]">Orders</h1>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {filters.map((filter, index) => (
              <button
                key={filter}
                type="button"
                className={`rounded-full border px-4 py-2 mono text-xs uppercase tracking-[0.14em] ${
                  index === 0
                    ? "border-[var(--primary)] bg-[var(--ms-hover-bg)] text-[var(--ms-heading)]"
                    : "border-[var(--ms-border)] bg-[var(--ms-bg-card)] text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)]"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-5">
            {orders.length === 0 ? (
              <div className="ms-card rounded-xl p-8 text-center">
                <h2 className="text-xl font-black">No orders yet</h2>
                <p className="mt-3 text-[var(--ms-body)]">Placed orders will appear here after checkout.</p>
                <Link href="/games" className="ms-button mt-6 inline-flex h-11 items-center px-5 mono text-xs uppercase tracking-[0.14em]">
                  Browse Games
                </Link>
              </div>
            ) : (
              orders.map((order) => {
                const primaryItem = order.items[0];

                return (
                  <article key={order.id} className="ms-card ms-card-hover rounded-xl p-5">
                    <div className="grid gap-5 md:grid-cols-[96px_1fr_auto] md:items-center">
                      {order.primaryImage ? (
                        <img src={order.primaryImage} alt="" className="h-24 w-24 rounded-md object-cover" />
                      ) : (
                        <PlaceholderAsset alt={`${order.serviceSummary} order preview`} className="h-24 rounded-md" imageClassName="p-4" />
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-xl font-black">{order.serviceSummary}</h2>
                          <span className="rounded-full border border-[var(--ms-border)] px-3 py-1 mono text-xs uppercase text-[var(--ms-success)]">
                            {order.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="mono mt-2 break-all text-xs uppercase tracking-[0.14em] text-[var(--ms-body)]">
                          Order ref: {order.orderReference}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {order.items.map((item) => (
                            <span key={item.id} className="rounded-full border border-[var(--ms-border)] px-3 py-1 text-xs text-[var(--ms-body)]">
                              {item.service.title}
                            </span>
                          ))}
                        </div>
                        <p className="mono mt-3 text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]">
                          {formatOrderDate(order.createdAt)} / {primaryItem?.service.gameName ?? "Game"} / {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-5 md:flex-col md:items-end">
                        <span className="mono text-xl text-[var(--ms-price)]">{formatOrderMoney(order.total, order.currency)}</span>
                        <Link href={`/profile/orders/${order.id}`} className="ms-button h-10 px-5 mono text-xs uppercase tracking-[0.14em]">
                          View Details
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
