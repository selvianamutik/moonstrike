import Link from "next/link";
import { PlaceholderAsset } from "@/components/asset-image";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireVerifiedUser } from "@/lib/auth/session";
import { formatMemberSince, getUserDisplayName, getUserInitials } from "@/lib/auth/user-display";
import { formatOrderDate, formatOrderMoney, formatOrderOptionValue, listCustomerOrders, type CustomerOrder } from "@/lib/orders";

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

function isOngoingOrder(order: CustomerOrder) {
  return !["completed", "refunded"].includes(order.status);
}

export default async function ProfilePage() {
  const user = await requireVerifiedUser("/profile");
  const orders = await listCustomerOrders(user.id);
  const ongoingOrders = orders.filter(isOngoingOrder);
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
          <div className="flex flex-col justify-between gap-5 border-b border-[var(--ms-border)] pb-7 md:flex-row md:items-end">
            <div>
              <p className="mono text-xs uppercase tracking-[0.28em] text-[var(--ms-gradient-end)]">Customer Dashboard</p>
              <h2 className="font-display mt-3 text-4xl font-black tracking-[-0.05em]">Overview</h2>
              <p className="mt-3 text-[var(--ms-body)]">Track active services that still need attention or delivery.</p>
            </div>
            <Link href="/games" className="ms-button flex h-11 items-center justify-center px-5 mono text-xs uppercase tracking-[0.14em]">
              Browse Games
            </Link>
          </div>

          <section className="mt-8">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <h3 className="text-2xl font-black">Ongoing Orders</h3>
                <p className="mt-2 text-sm text-[var(--ms-body)]">Completed and refunded orders live in the Orders page.</p>
              </div>
              <Link href="/profile/orders" className="text-sm text-[var(--ms-gradient-end)] hover:text-[var(--ms-heading)]">
                View all orders
              </Link>
            </div>

            <div className="mt-6 space-y-5">
              {ongoingOrders.length === 0 ? (
                <div className="ms-card rounded-xl p-8 text-center">
                  <h4 className="text-xl font-black">No ongoing orders</h4>
                  <p className="mt-3 text-[var(--ms-body)]">New paid services will appear here until they are completed.</p>
                  <Link href="/games" className="ms-button mt-6 inline-flex h-11 items-center px-5 mono text-xs uppercase tracking-[0.14em]">
                    Browse Games
                  </Link>
                </div>
              ) : (
                ongoingOrders.map((order) => {
                  const primaryItem = order.items[0];
                  const optionSummary = order.items
                    .flatMap((item) =>
                      Object.entries(item.selectedOptionsSnapshot).map(([label, option]) => `${item.service.title} - ${label}: ${formatOrderOptionValue(option.value)}`),
                    )
                    .join(" / ");

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
                            <h4 className="text-xl font-black">{order.serviceSummary}</h4>
                            <span className="rounded-full border border-[var(--ms-border)] px-3 py-1 mono text-xs uppercase text-[var(--ms-success)]">
                              {order.status.replace("_", " ")}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-[var(--ms-body)]">{optionSummary || "No selected options"}</p>
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
          </section>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
