'use client';

import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { PlaceholderAsset } from '@/components/asset-image';
import { OrderSummary } from '@/components/order-summary';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { calculateOrderTotals } from '@/lib/catalog';

export function CartPageClient() {
  const { items, subtotal, updateQuantity, removeItem, announceChange } = useCart();
  const totals = calculateOrderTotals(subtotal);

  const handleQuantityChange = (id: string, currentQuantity: number, delta: number) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity >= 1) {
      updateQuantity(id, newQuantity);
      announceChange(`Quantity updated to ${newQuantity}`);
    }
  };

  const handleRemove = (id: string, itemName: string) => {
    removeItem(id);
    announceChange(`${itemName} removed from cart`);
  };

  if (items.length === 0) {
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
            </div>
            <div className="mt-12 flex flex-col items-center justify-center gap-6 py-20">
              <div className="rounded-full border border-[var(--ms-border)] p-8">
                <svg className="h-16 w-16 text-[var(--ms-body)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold">Your cart is empty</h2>
              <p className="text-[var(--ms-body)]">Add some services to get started</p>
              <Link href="/games" className="ms-button mt-4 flex h-12 items-center justify-center rounded-md px-8 font-black">
                Browse Services
              </Link>
            </div>
          </div>
        </section>
        <SiteFooter />
      </main>
    );
  }

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

          <div className="mt-8 space-y-5" role="list" aria-label="Cart items">
            {items.map((item) => (
              <article
                key={item.id}
                role="listitem"
                className="ms-card ms-card-hover rounded-xl p-5"
              >
                <div className="grid gap-5 md:grid-cols-[120px_1fr_auto]">
                  <PlaceholderAsset
                    alt={`${item.service.name} preview`}
                    className="h-28 rounded-md"
                    imageClassName="p-4"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-black">{item.service.offerTitle ?? item.service.name}</h2>
                      <span className="rounded-full border border-[var(--ms-border)] px-3 py-1 mono text-xs text-[var(--ms-body)]">
                        {item.region}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--ms-body)]">
                      {item.selectedOptions.length > 0
                        ? `${item.selectedOptions.length} options configured`
                        : 'Standard service'}
                    </p>
                    <div className="mt-4 grid gap-2 md:grid-cols-2">
                      {item.selectedOptions.map((option, idx) => (
                        <div
                          key={`${item.id}-${option.group}-${idx}`}
                          className="rounded-md border border-[var(--ms-border)] bg-[var(--ms-hover-bg)] px-3 py-2 text-sm"
                        >
                          <span className="text-[var(--ms-body)]">{option.group}: </span>
                          <span>{option.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-row items-center justify-between gap-6 md:flex-col md:items-end">
                    {/* Quantity Controls */}
                    <div
                      className="flex h-11 min-h-[44px] items-center overflow-hidden rounded-md border border-[var(--ms-border)]"
                      role="group"
                      aria-label={`Quantity for ${item.service.name}`}
                    >
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                        disabled={item.quantity <= 1}
                        className="flex h-full min-w-[44px] items-center justify-center px-3 text-[var(--ms-body)] transition-colors hover:bg-[var(--ms-hover-bg)] focus:ring-2 focus:ring-[var(--ms-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span
                        className="border-x border-[var(--ms-border)] px-4 mono"
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                        className="flex h-full min-w-[44px] items-center justify-center px-3 text-[var(--ms-body)] transition-colors hover:bg-[var(--ms-hover-bg)] focus:ring-2 focus:ring-[var(--ms-primary)]"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mono text-xl text-[var(--ms-price)]">${item.lineTotal.toFixed(2)}</p>
                    <button
                      onClick={() => handleRemove(item.id, item.service.name)}
                      className="group flex items-center gap-2 text-sm text-[var(--ms-danger)] transition-colors hover:text-red-400 focus:ring-2 focus:ring-[var(--ms-danger)]"
                      aria-label={`Remove ${item.service.name} from cart`}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Remove</span>
                    </button>
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
            { label: 'Subtotal', value: `$${totals.subtotal.toFixed(2)}` },
            { label: 'Service Fee', value: `$${totals.serviceFee.toFixed(2)}` },
            { label: 'Discount', value: `-$${totals.discount.toFixed(2)}` },
            { label: 'Taxes', value: `$${totals.taxes.toFixed(2)}` },
          ]}
          serviceName={`${items.length} configured service${items.length !== 1 ? 's' : ''}`}
          serviceMeta="Cart ready for checkout"
          total={`$${totals.total.toFixed(2)}`}
        />
      </section>
      <SiteFooter />
    </main>
  );
}
