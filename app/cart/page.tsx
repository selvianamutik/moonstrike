import Link from "next/link";
import { PlaceholderAsset } from "@/components/asset-image";
import { OrderSummary } from "@/components/order-summary";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { calculateOrderTotals, getCartLines } from "@/lib/catalog";

export default function CartPage() {
  const cartLines = getCartLines();
  const subtotal = cartLines.reduce((total, item) => total + item.lineTotal, 0);
  const totals = calculateOrderTotals(subtotal);

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />
      <section className="ms-shell grid gap-10 py-16 lg:grid-cols-[1fr_390px]">
        <div>
          <div className="flex flex-col justify-between gap-4 border-b border-[var(--ms-border)] pb-7 md:flex-row md:items-end">
            <div>
              <p className="mono text-xs uppercase tracking-[0.28em] text-[var(--ms-gradient-end)]">Cart / guest session</p>
              <h1 className="font-display mt-3 text-4xl font-black tracking-[-0.05em]">Your selected services</h1>
            </div>
            <Link href="/games" className="mono text-sm uppercase tracking-[0.22em] text-[var(--ms-gradient-end)]">
              Add more services
            </Link>
          </div>

          <div className="mt-8 space-y-5">
            {cartLines.map((item) => (
              <article key={item.id} className="ms-card ms-card-hover rounded-xl p-5">
                <div className="grid gap-5 md:grid-cols-[120px_1fr_auto]">
                  <PlaceholderAsset alt={`${item.service.name} preview`} className="h-28 rounded-md" imageClassName="p-4" />
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-black">{item.service.offerTitle ?? item.service.name}</h2>
                      <span className="rounded-full border border-[var(--ms-border)] px-3 py-1 mono text-xs text-[var(--ms-body)]">
                        {item.region}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--ms-body)]">{item.service.description}</p>
                    <div className="mt-4 grid gap-2 md:grid-cols-2">
                      {item.selectedOptions.map((option) => (
                        <div key={`${item.id}-${option.group}`} className="rounded-md border border-[var(--ms-border)] bg-[var(--ms-hover-bg)] px-3 py-2 text-sm">
                          <span className="text-[var(--ms-body)]">{option.group}: </span>
                          <span>{option.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-row items-center justify-between gap-6 md:flex-col md:items-end">
                    <div className="flex h-10 items-center overflow-hidden rounded-md border border-[var(--ms-border)] mono">
                      <button className="h-full px-3 text-[var(--ms-body)]">-</button>
                      <span className="border-x border-[var(--ms-border)] px-4">{item.quantity}</span>
                      <button className="h-full px-3 text-[var(--ms-body)]">+</button>
                    </div>
                    <p className="mono text-xl text-[var(--ms-price)]">${item.lineTotal.toFixed(2)}</p>
                    <button className="text-sm text-[var(--ms-danger)]">Remove</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <OrderSummary
          ctaHref="/checkout"
          ctaLabel="Proceed to Checkout"
          rows={[
            { label: "Subtotal", value: `$${totals.subtotal.toFixed(2)}` },
            { label: "Service Fee", value: `$${totals.serviceFee.toFixed(2)}` },
            { label: "Discount", value: `-$${totals.discount.toFixed(2)}` },
            { label: "Taxes", value: `$${totals.taxes.toFixed(2)}` },
          ]}
          serviceName={`${cartLines.length} configured services`}
          serviceMeta="Cart ready for checkout"
          total={`$${totals.total.toFixed(2)}`}
        />
      </section>
      <SiteFooter />
    </main>
  );
}
