import Link from "next/link";
import { notFound } from "next/navigation";
import { PlaceholderAsset } from "@/components/asset-image";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { RefundRequestButton } from "@/components/profile/RefundRequestButton";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireVerifiedUser } from "@/lib/auth/session";
import { formatMemberSince, getUserDisplayName, getUserInitials } from "@/lib/auth/user-display";
import {
  formatOrderMoney,
  formatOrderOptionValue,
  getCustomerOrder,
} from "@/lib/orders";

type ProfileOrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

const timelineSteps = ["Placed", "Confirmed", "In Progress", "Delivered", "Completed"];

function completedStepCount(status: string) {
  if (status === "completed") return 5;
  if (status === "delivered") return 4;
  if (status === "in_progress") return 3;
  if (status === "confirmed") return 2;
  return 1;
}

export const dynamic = "force-dynamic";

export default async function ProfileOrderDetailPage({ params }: ProfileOrderDetailPageProps) {
  const user = await requireVerifiedUser("/profile/orders");
  const { id } = await params;
  const order = await getCustomerOrder(user.id, id);

  if (!order) notFound();

  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(displayName, user.email);
  const memberSince = formatMemberSince(user.created_at);
  const completedSteps = completedStepCount(order.status);
  const canRequestRefund = !["completed", "refund_requested", "refunded"].includes(order.status);

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />
      
      <section className="ms-shell grid gap-10 py-16 lg:grid-cols-[300px_1fr]">
        <ProfileSidebar displayName={displayName} email={user.email} initials={initials} memberSince={memberSince} />

        <div>
          <div>
          <div className="flex flex-col justify-between gap-5 border-b border-[var(--ms-border)] pb-7 md:flex-row md:items-end">
            <div>
              <p className="mono text-xs uppercase tracking-[0.28em] text-[var(--ms-gradient-end)]">
                Profile / Order Detail
              </p>
              <h1 className="font-display mt-3 text-4xl font-black tracking-[-0.05em]">Order Detail</h1>
              <p className="mt-3 text-[var(--ms-body)]">{order.serviceSummary}</p>
            </div>
            <span className="w-fit rounded-full border border-[var(--ms-gradient-end)]/50 px-4 py-2 mono text-sm uppercase text-[var(--ms-success)]">
              {order.status.replace("_", " ")}
            </span>
          </div>
          <section className="mt-8 rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-6">
            <h2 className="text-xl font-black">Order Timeline</h2>
            <div className="mt-7 grid gap-4 md:grid-cols-5">
              {timelineSteps.map((label, index) => {
                const isComplete = index < completedSteps;
                return (
                  <div
                    key={label}
                    className={`flex h-12 items-center justify-center rounded-md border mono text-xs ${
                      isComplete
                        ? "border-[var(--ms-gradient-end)] bg-[var(--ms-gradient-end)]/10 text-[var(--ms-gradient-end)]"
                        : "border-[var(--ms-border)] bg-black/20 text-[var(--ms-body)]"
                    }`}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-8 rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-6">
            <h2 className="text-xl font-black">Services in this order</h2>
            <div className="mt-5 space-y-4">
              {order.items.map((item, index) => {
                const options = Object.entries(item.selectedOptionsSnapshot);

                return (
                  <details key={item.id} className="group rounded-lg border border-[var(--ms-border)] bg-black/20 p-4" open={index === 0}>
                    <summary className="flex cursor-pointer list-none flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex gap-4">
                        {item.service.image ? (
                          <img src={item.service.image} alt="" className="h-20 w-20 rounded-md object-cover" />
                        ) : (
                          <PlaceholderAsset alt={`${item.service.title} order preview`} className="h-20 w-20 rounded-md" imageClassName="p-3" />
                        )}
                        <div>
                          <h3 className="text-lg font-black">{item.service.title}</h3>
                          <p className="mono mt-2 text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]">
                            {item.service.gameName} / {item.service.categoryName}
                          </p>
                        </div>
                      </div>
                      <span className="mono text-lg font-black text-[var(--ms-price)]">{formatOrderMoney(item.total, item.currency)}</span>
                    </summary>
                    <div className="mt-5 border-t border-[var(--ms-border)] pt-5">
                      <p className="leading-7 text-[var(--ms-body)]">
                        {item.service.description || `${item.service.categoryName} service for ${item.service.gameName}.`}
                      </p>
                      <div className="mt-5 space-y-3">
                        {options.length === 0 ? (
                          <p className="text-sm text-[var(--ms-body)]">No selected options.</p>
                        ) : (
                          options.map(([label, option]) => (
                            <div key={label} className="flex justify-between gap-4 border-b border-[var(--ms-border)] pb-3">
                              <span className="text-[var(--ms-body)]">{label}</span>
                              <span className="text-right">
                                {formatOrderOptionValue(option.value)}
                                <span className="mono ml-2 text-[var(--ms-price)]">
                                  +{formatOrderMoney(order.currency === "EUR" ? option.priceEUR ?? 0 : option.priceUSD ?? 0, order.currency)}
                                </span>
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap gap-3 mono text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]">
              <span className="rounded-full border border-[var(--ms-border)] px-3 py-1">{order.paymentStatus.replace("_", " ")}</span>
              <span className="rounded-full border border-[var(--ms-border)] px-3 py-1">Order ref: {order.orderReference}</span>
              <span className="rounded-full border border-[var(--ms-border)] px-3 py-1">Payment ref: {order.transactionId}</span>
            </div>
          </section>

          <section className="mt-8 grid gap-6">
            <article className="rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-6">
              <h2 className="text-xl font-black">Price Breakdown</h2>
              <div className="mt-5 space-y-3">
                <PriceRow label="Order total" value={formatOrderMoney(order.total, order.currency)} />
                <PriceRow label="Currency" value={order.currency} />
                <PriceRow label="Payment provider" value={order.paymentProvider} />
                <div className="flex justify-between gap-4 border-t border-[var(--ms-border)] pt-4 text-lg font-black">
                  <span>Total</span>
                  <span className="mono text-[var(--ms-price)]">{formatOrderMoney(order.total, order.currency)}</span>
                </div>
              </div>
            </article>
          </section>

          <section className="mt-8 rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black">Support Actions</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--ms-body)]">
                  Use support chat for delivery questions, booster updates, or refund requests.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/profile/chat" className="rounded-md border border-[var(--ms-border)] px-4 py-3 text-sm text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-heading)]">
                  Open Support Chat
                </Link>
                {canRequestRefund ? <RefundRequestButton orderId={order.id} /> : null}
              </div>
            </div>
          </section>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--ms-border)] pb-3">
      <span className="text-[var(--ms-body)]">{label}</span>
      <span className="mono text-right">{value}</span>
    </div>
  );
}
