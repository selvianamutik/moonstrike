import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderSummary } from "@/components/order-summary";
import { PlaceholderAsset } from "@/components/asset-image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { calculateOrderTotals, getOrderById } from "@/lib/catalog";

type ProfileOrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

const timelineSteps = ["Placed", "Confirmed", "Delivered", "Completed"];

export default async function ProfileOrderDetailPage({ params }: ProfileOrderDetailPageProps) {
  const { id } = await params;
  const order = getOrderById(id);

  if (!order) notFound();

  const totals = calculateOrderTotals(order.subtotal);
  const optionTotal = order.selectedOptions.reduce((total, option) => total + option.priceModifier, 0);
  const completedSteps = order.status === "completed" ? 4 : order.status === "in_progress" ? 2 : 1;
  const canRequestRefund = !["completed", "cancelled", "refunded"].includes(order.status);

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />
      <section className="ms-shell grid gap-10 py-16 lg:grid-cols-[1fr_390px]">
        <div>
          <div className="flex flex-col justify-between gap-5 border-b border-[var(--ms-border)] pb-7 md:flex-row md:items-end">
            <div>
              <p className="mono text-xs uppercase tracking-[0.28em] text-[var(--ms-gradient-end)]">
                Profile / Order Detail
              </p>
              <h1 className="font-display mt-3 text-4xl font-black tracking-[-0.05em]">{order.id}</h1>
              <p className="mt-3 text-[var(--ms-body)]">{order.service.name}</p>
            </div>
            <span className="w-fit rounded-full border border-[var(--ms-gradient-end)]/50 px-4 py-2 mono text-sm uppercase text-[var(--ms-success)]">
              {order.status.replace("_", " ")}
            </span>
          </div>

          <section className="mt-8 rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-6">
            <div className="grid gap-5 md:grid-cols-[140px_1fr]">
              <PlaceholderAsset isHidden={false} alt={`${order.service.name} order preview`} className="h-32 rounded-md" imageClassName="p-5" />
              <div>
                <h2 className="text-2xl font-black">{order.service.offerTitle ?? order.service.name}</h2>
                <p className="mt-3 leading-7 text-[var(--ms-body)]">{order.service.description}</p>
                <div className="mt-5 flex flex-wrap gap-3 mono text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]">
                  <span className="rounded-full border border-[var(--ms-border)] px-3 py-1">{order.region}</span>
                  <span className="rounded-full border border-[var(--ms-border)] px-3 py-1">{order.paymentStatus}</span>
                  <span className="rounded-full border border-[var(--ms-border)] px-3 py-1">{order.transactionId}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-6">
            <h2 className="text-xl font-black">Order Timeline</h2>
            <div className="mt-7 grid gap-4 md:grid-cols-4">
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

          <section className="mt-8 grid gap-6 md:grid-cols-2">
            <article className="rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-6">
              <h2 className="text-xl font-black">Selected Options</h2>
              <div className="mt-5 space-y-3">
                {order.selectedOptions.map((option) => (
                  <div key={option.group} className="flex justify-between gap-4 border-b border-[var(--ms-border)] pb-3">
                    <span className="text-[var(--ms-body)]">{option.group}</span>
                    <span>
                      {option.value}
                      <span className="mono ml-2 text-[var(--ms-price)]">+${option.priceModifier.toFixed(2)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-6">
              <h2 className="text-xl font-black">Price Breakdown</h2>
              <div className="mt-5 space-y-3">
                <PriceRow label="Base price" value={`$${order.service.startingPrice.toFixed(2)}`} />
                <PriceRow label="Options" value={`$${optionTotal.toFixed(2)}`} />
                <PriceRow label="Service fee" value={`$${totals.serviceFee.toFixed(2)}`} />
                <PriceRow label="Discount" value={`-$${totals.discount.toFixed(2)}`} />
                <div className="flex justify-between gap-4 border-t border-[var(--ms-border)] pt-4 text-lg font-black">
                  <span>Total</span>
                  <span className="mono text-[var(--ms-price)]">${totals.total.toFixed(2)}</span>
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
                <button className="rounded-md border border-[var(--ms-border)] px-4 py-3 text-sm text-[var(--ms-body)]">
                  Open Support Chat
                </button>
                {canRequestRefund ? <button className="ms-button px-4 py-3 text-sm">Request Refund</button> : null}
              </div>
            </div>
          </section>
        </div>

        <OrderSummary
          ctaHref="/refund-policy"
          ctaLabel="Refund Policy"
          rows={[
            { label: "Subtotal", value: `$${totals.subtotal.toFixed(2)}` },
            { label: "Service Fee", value: `$${totals.serviceFee.toFixed(2)}` },
            { label: "Discount", value: `-$${totals.discount.toFixed(2)}` },
            { label: "Taxes", value: `$${totals.taxes.toFixed(2)}` },
          ]}
          serviceName={order.service.offerTitle ?? order.service.name}
          serviceMeta={`${order.region} / ${order.paymentStatus}`}
          total={`$${totals.total.toFixed(2)}`}
        />
      </section>
      <SiteFooter />
    </main>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--ms-border)] pb-3">
      <span className="text-[var(--ms-body)]">{label}</span>
      <span className="mono">{value}</span>
    </div>
  );
}
