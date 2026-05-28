import Link from "next/link";
import { PlaceholderAsset } from "@/components/asset-image";
import { LogoutButton } from "@/components/common/LogoutButton";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { calculateOrderTotals, getProfileOrders } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const filters = ["All", "In Progress", "Delivered", "Completed", "Refund Requested", "Refunded"];

function getDisplayName(userMetadata: Record<string, unknown>, email?: string) {
  const metadataName =
    userMetadata.username ||
    userMetadata.full_name ||
    userMetadata.name ||
    userMetadata.preferred_username;

  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim();
  }

  return email?.split("@")[0] || "Moon Strike Player";
}

function getInitials(displayName: string, email?: string) {
  const source = displayName || email || "MS";
  const parts = source
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function formatMemberSince(date?: string) {
  if (!date) return "Unknown";

  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/profile");
  }

  if (!user.email_confirmed_at) {
    redirect("/login?unverified=1&next=/profile");
  }

  const orders = getProfileOrders();
  const totalSpent = orders.reduce((total, order) => total + calculateOrderTotals(order.subtotal).total, 0);
  const displayName = getDisplayName(user.user_metadata, user.email);
  const initials = getInitials(displayName, user.email);
  const memberSince = formatMemberSince(user.created_at);

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />
      <section className="ms-shell grid gap-10 py-16 lg:grid-cols-[300px_1fr]">
        <aside className="ms-card h-fit rounded-xl p-6 lg:sticky lg:top-32">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--ms-gradient-end)] bg-[var(--ms-hover-bg)] font-display text-2xl font-black">
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-black">{displayName}</h1>
              <p className="mt-1 break-all text-sm text-[var(--ms-body)]">{user.email}</p>
            </div>
          </div>

          <dl className="mt-8 space-y-4 border-y border-[var(--ms-border)] py-6">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--ms-body)]">Member since</dt>
              <dd>{memberSince}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--ms-body)]">Total Orders</dt>
              <dd>{orders.length}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--ms-body)]">Total Spent</dt>
              <dd className="mono text-[var(--ms-price)]">${totalSpent.toFixed(2)}</dd>
            </div>
          </dl>

          <button type="button" className="mt-6 h-11 w-full rounded-md border border-[var(--ms-border)] text-sm text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-heading)]">
            Edit Profile
          </button>
          <LogoutButton />
        </aside>

        <div>
          <div className="flex flex-col justify-between gap-5 border-b border-[var(--ms-border)] pb-7 md:flex-row md:items-end">
            <div>
              <p className="mono text-xs uppercase tracking-[0.28em] text-[var(--ms-gradient-end)]">Customer Profile</p>
              <h2 className="font-display mt-3 text-4xl font-black tracking-[-0.05em]">Account overview</h2>
            </div>
            <div className="inline-flex w-fit rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-1 mono text-xs uppercase tracking-[0.16em]">
              <span className="rounded-full bg-[var(--primary)] px-4 py-2">Orders</span>
              <span className="px-4 py-2 text-[var(--ms-body)]">Transactions</span>
            </div>
          </div>

          <section className="mt-8">
            <h3 className="text-2xl font-black">Order History</h3>
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
              {orders.map((order) => {
                const totals = calculateOrderTotals(order.subtotal);
                const optionSummary = order.selectedOptions.map((option) => `${option.group}: ${option.value}`).join(" / ");

                return (
                  <article key={order.id} className="ms-card ms-card-hover rounded-xl p-5">
                    <div className="grid gap-5 md:grid-cols-[96px_1fr_auto] md:items-center">
                      <PlaceholderAsset alt={`${order.service.name} order preview`} className="h-24 rounded-md" imageClassName="p-4" />
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="text-xl font-black">{order.service.offerTitle ?? order.service.name}</h4>
                          <span className="rounded-full border border-[var(--ms-border)] px-3 py-1 mono text-xs uppercase text-[var(--ms-success)]">
                            {order.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--ms-body)]">{optionSummary}</p>
                        <p className="mono mt-3 text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]">
                          {order.createdAt} / {order.region}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-5 md:flex-col md:items-end">
                        <span className="mono text-xl text-[var(--ms-price)]">${totals.total.toFixed(2)}</span>
                        <Link href={`/profile/orders/${order.id}`} className="ms-button h-10 px-5 mono text-xs uppercase tracking-[0.14em]">
                          View Details
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="mt-12">
            <h3 className="text-2xl font-black">Transaction History</h3>
            <div className="mt-5 overflow-hidden rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)]">
              <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 border-b border-[var(--ms-border)] px-5 py-4 mono text-xs uppercase tracking-[0.16em] text-[var(--ms-body)] md:grid-cols-[1fr_1.5fr_1fr_1fr_1fr]">
                <span>TXN ID</span>
                <span className="hidden md:block">Service</span>
                <span>Date</span>
                <span>Amount</span>
                <span className="hidden md:block">Status</span>
              </div>
              {orders.map((order) => {
                const totals = calculateOrderTotals(order.subtotal);

                return (
                  <div key={order.transactionId} className="grid grid-cols-[1fr_1fr_1fr] gap-4 border-b border-[var(--ms-border)] px-5 py-4 text-sm last:border-0 md:grid-cols-[1fr_1.5fr_1fr_1fr_1fr]">
                    <span className="mono">{order.transactionId}</span>
                    <span className="hidden md:block">{order.service.name}</span>
                    <span>{order.createdAt}</span>
                    <span className="mono text-[var(--ms-price)]">${totals.total.toFixed(2)}</span>
                    <span className="hidden text-[var(--ms-success)] md:block">{order.paymentStatus}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
