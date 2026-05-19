import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderSummary } from "@/components/order-summary";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { calculateOrderTotals, getOrderById } from "@/lib/catalog";

type OrderDetailPageProps = {
  params: Promise<{ orderId: string }>;
};

const progressSteps = [
  ["waiting_payment", "Waiting Payment"],
  ["paid", "Paid"],
  ["assigned", "Assigned"],
  ["in_progress", "In Progress"],
  ["completed", "Completed"],
];

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { orderId } = await params;
  const order = getOrderById(orderId);

  if (!order) notFound();

  const totals = calculateOrderTotals(order.subtotal);
  const activeIndex = progressSteps.findIndex(([status]) => status === order.status);

  return (
    <main className="min-h-screen bg-[var(--background)] text-white">
      <SiteHeader />
      <section className="ms-shell grid gap-10 py-16 lg:grid-cols-[1fr_390px]">
        <div>
          <p className="mono text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Order detail</p>
          <div className="mt-3 flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-7 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-black tracking-[-0.05em]">{order.id}</h1>
              <p className="mt-3 text-[var(--muted)]">
                {order.service.name} for {order.userName}
              </p>
            </div>
            <span className="w-fit rounded-full border border-[var(--accent)]/50 px-4 py-2 mono text-sm uppercase text-[var(--success)]">
              {order.status.replace("_", " ")}
            </span>
          </div>

          <section className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-6">
            <h2 className="text-xl font-black">Progress tracker</h2>
            <div className="mt-7 grid gap-4 md:grid-cols-5">
              {progressSteps.map(([status, label], index) => {
                const isComplete = index <= activeIndex;
                return (
                  <div key={status} className="relative">
                    <div className={`flex h-12 items-center justify-center rounded-md border mono text-xs ${isComplete ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]" : "border-[var(--border)] bg-black/20 text-[var(--muted)]"}`}>
                      {label}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-8 grid gap-6 md:grid-cols-2">
            <article className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-6">
              <h2 className="text-xl font-black">Service & options</h2>
              <div className="mt-5 space-y-3">
                <div className="flex justify-between gap-4 border-b border-[var(--border)] pb-3">
                  <span className="text-[var(--muted)]">Service</span>
                  <span>{order.service.offerTitle ?? order.service.name}</span>
                </div>
                <div className="flex justify-between gap-4 border-b border-[var(--border)] pb-3">
                  <span className="text-[var(--muted)]">Region</span>
                  <span>{order.region}</span>
                </div>
                {order.selectedOptions.map((option) => (
                  <div key={option.group} className="flex justify-between gap-4 border-b border-[var(--border)] pb-3">
                    <span className="text-[var(--muted)]">{option.group}</span>
                    <span>{option.value}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-6">
              <h2 className="text-xl font-black">Payment & transaction</h2>
              <div className="mt-5 space-y-3">
                <div className="flex justify-between gap-4 border-b border-[var(--border)] pb-3">
                  <span className="text-[var(--muted)]">Payment Status</span>
                  <span className="text-[var(--success)]">{order.paymentStatus}</span>
                </div>
                <div className="flex justify-between gap-4 border-b border-[var(--border)] pb-3">
                  <span className="text-[var(--muted)]">Transaction ID</span>
                  <span className="mono">{order.transactionId}</span>
                </div>
                <div className="flex justify-between gap-4 border-b border-[var(--border)] pb-3">
                  <span className="text-[var(--muted)]">Created</span>
                  <span>{order.createdAt}</span>
                </div>
              </div>
            </article>
          </section>

          <section className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black">Order chat</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Internal chat placeholder for support, booster updates, and proof of completion.
                </p>
              </div>
              <div className="flex gap-3">
                <button className="rounded-md border border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">
                  Open Chat
                </button>
                <button className="ms-button px-4 py-3 text-sm">Confirm Completion</button>
              </div>
            </div>
          </section>
        </div>

        <OrderSummary
          ctaHref="/refund"
          ctaLabel="Dispute / Refund Policy"
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
