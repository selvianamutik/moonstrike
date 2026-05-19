import Link from "next/link";
import { OrderSummary } from "@/components/order-summary";
import { calculateOrderTotals, getCartLines } from "@/lib/catalog";

export default function CheckoutPage() {
  const cartLines = getCartLines();
  const subtotal = cartLines.reduce((total, item) => total + item.lineTotal, 0);
  const totals = calculateOrderTotals(subtotal);

  return (
    <main className="min-h-screen bg-[var(--background)] text-white">
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-10">
          <Link href="/cart" className="text-[var(--muted)]">← Cancel & Return</Link>
          <Link href="/" className="text-2xl font-black"><span className="brand-gradient">Moon Strike</span></Link>
          <span />
        </div>
      </header>
      <section className="mx-auto grid max-w-7xl gap-12 px-10 py-20 lg:grid-cols-[1fr_450px]">
        <div>
          <h1 className="text-4xl font-black">Secure Checkout</h1>
          <p className="mt-4 text-[var(--muted)]">Complete your transaction to dominate the game.</p>
          <h2 className="mt-12 text-2xl font-black">Payment Method</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {["Credit Card", "PayPal", "Crypto"].map((method, index) => (
              <button key={method} className={`${index === 0 ? "border-[var(--primary)] bg-[#241843] shadow-[0_0_22px_rgba(136,82,255,0.35)]" : "border-[var(--border)] bg-[var(--panel-strong)]"} h-24 rounded-md border mono text-sm uppercase text-[var(--muted)]`}>
                {method}
              </button>
            ))}
          </div>
          <form className="mt-12 rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-8">
            <h2 className="text-xl font-medium">Card Details</h2>
            <label className="mt-8 block mono text-xs uppercase text-[var(--muted)]">Name on Card</label>
            <input placeholder="John Doe" className="mt-2 h-13 w-full rounded-md border border-[var(--border)] bg-[var(--field)] px-4" />
            <label className="mt-6 block mono text-xs uppercase text-[var(--muted)]">Card Number</label>
            <input placeholder="0000 0000 0000 0000" className="mt-2 h-13 w-full rounded-md border border-[var(--border)] bg-[var(--field)] px-4" />
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <label className="block mono text-xs uppercase text-[var(--muted)]">Expiry Date</label>
                <input placeholder="MM/YY" className="mt-2 h-13 w-full rounded-md border border-[var(--border)] bg-[var(--field)] px-4 text-center" />
              </div>
              <div>
                <label className="block mono text-xs uppercase text-[var(--muted)]">CVC</label>
                <input placeholder="123" className="mt-2 h-13 w-full rounded-md border border-[var(--border)] bg-[var(--field)] px-4 text-center" />
              </div>
            </div>
          </form>
        </div>
        <OrderSummary
          ctaHref="/orders/MS-2401"
          ctaLabel="Complete Purchase"
          rows={[
            { label: "Subtotal", value: `$${totals.subtotal.toFixed(2)}` },
            { label: "Service Fee", value: `$${totals.serviceFee.toFixed(2)}` },
            { label: "Discount", value: `-$${totals.discount.toFixed(2)}` },
            { label: "Taxes", value: `$${totals.taxes.toFixed(2)}` },
          ]}
          serviceName={`${cartLines.length} configured services`}
          serviceMeta="Immediate Start"
          total={`$${totals.total.toFixed(2)}`}
        />
      </section>
    </main>
  );
}
