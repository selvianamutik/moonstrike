import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { PlaceholderAsset } from "@/components/asset-image";
import { LivePageRefresh } from "@/components/live-page-refresh";
import { ConfirmOrderButton } from "@/components/profile/ConfirmOrderButton";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { RefundRequestButton } from "@/components/profile/RefundRequestButton";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireVerifiedUser } from "@/lib/auth/session";
import { formatMemberSince, getUserDisplayName, getUserInitials } from "@/lib/auth/user-display";
import {
  formatOrderMoney,
  formatOrderOptionValue,
  formatPaymentProvider,
  canRequestOrderRefund,
  getRefundWindowDays,
  getCustomerOrder,
} from "@/lib/orders";

type ProfileOrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

const timelineSteps = ["Pending", "Confirmed", "In Progress", "Delivered", "Completed"];

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
  const refundWindowDays = await getRefundWindowDays();
  const canRequestRefund = canRequestOrderRefund(order.status, order.completedAt, refundWindowDays);

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <LivePageRefresh intervalMs={10_000} />
      <SiteHeader />
      
      <section className="ms-shell grid gap-8 py-16 lg:grid-cols-[270px_minmax(0,1fr)]">
        <ProfileSidebar displayName={displayName} email={user.email} initials={initials} memberSince={memberSince} />

        <div className="min-w-0">
          <div className="flex flex-col justify-between gap-5 border-b border-[var(--ms-border)] pb-7 md:flex-row md:items-end">
            <div className="min-w-0">
              <p className="mono text-xs uppercase tracking-[0.28em] text-[var(--ms-gradient-end)]">
                Profile / Order Detail
              </p>
              <h1 className="font-display mt-3 text-4xl font-black tracking-[-0.05em]">Order Detail</h1>
              <p className="mt-3 break-words text-[var(--ms-body)]">{order.orderReference}</p>
            </div>
            <div className="shrink-0 flex flex-col items-start gap-3 md:items-end">
              <span className="w-fit rounded-full border border-[var(--ms-gradient-end)]/50 px-4 py-2 mono text-sm uppercase text-[var(--ms-success)]">
                {order.status.replace("_", " ")}
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <Link href={`/profile/chat?order=${encodeURIComponent(order.orderReference)}`} className="ms-action-button inline-flex items-center justify-center rounded-md border border-[var(--ms-border)] px-4 py-3 text-sm text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-heading)]">
                  <MessageSquare size={16} />
                  Open Chat
                </Link>
                {order.status === "delivered" ? <ConfirmOrderButton orderId={order.id} /> : null}
                {canRequestRefund ? <RefundRequestButton orderId={order.id} compact /> : null}
              </div>
            </div>
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
            <h2 className="text-xl font-black">Order Information</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <InfoRow label="Checkout Session" value={order.checkoutSessionId} />
              <InfoRow label="Transaction Reference" value={order.transactionId} />
              <InfoRow label="Payment Provider" value={formatPaymentProvider(order.paymentProvider)} />
              <InfoRow label="Payment Status" value={order.paymentStatus.replace("_", " ")} />
              <InfoRow label="Created" value={new Intl.DateTimeFormat("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(order.createdAt))} />
              <InfoRow label="Currency" value={order.currency} />
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
          </section>

          <section className="mt-8 grid gap-6">
            <article className="rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-6">
              <h2 className="text-xl font-black">Price Breakdown</h2>
              <div className="mt-5 space-y-3">
                <PriceRow label="Order total" value={formatOrderMoney(order.total, order.currency)} />
                <PriceRow label="Currency" value={order.currency} />
                <PriceRow label="Payment provider" value={formatPaymentProvider(order.paymentProvider)} />
                <div className="flex justify-between gap-4 border-t border-[var(--ms-border)] pt-4 text-lg font-black">
                  <span>Total</span>
                  <span className="mono text-[var(--ms-price)]">{formatOrderMoney(order.total, order.currency)}</span>
                </div>
              </div>
            </article>
          </section>

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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--ms-border)] bg-black/20 p-4">
      <p className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--ms-body)]">{label}</p>
      <p className="mt-2 break-all font-bold capitalize text-[var(--ms-heading)]">{value}</p>
    </div>
  );
}
