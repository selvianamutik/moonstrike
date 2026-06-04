"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PlaceholderAsset } from "@/components/asset-image";
import { OrderSummary } from "@/components/order-summary";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useCurrency } from "@/hooks/useCurrency";

type CartApiItem = {
  id: string;
  selectedOptionsSnapshot: Record<string, { value: string | string[] | number | boolean; priceUSD: number; priceEUR: number }>;
  priceUSD: number;
  priceEUR: number;
  service: {
    title: string;
    slug: string;
    image: string;
    description: string;
    gameName: string;
    gameSlug: string;
    categoryName: string;
    categorySlug: string;
  } | null;
};

function formatMoney(value: number, currency: "USD" | "EUR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

function optionValue(value: string | string[] | number | boolean) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export function CartPageClient() {
  const { currency } = useCurrency();
  const [items, setItems] = useState<CartApiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState("");

  async function loadCart() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to load cart.");
        return;
      }

      setItems(Array.isArray(payload.items) ? payload.items : []);
    } catch {
      setError("Unable to reach the cart service.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCart();
  }, []);

  async function removeItem(id: string) {
    setRemovingId(id);
    setError("");

    try {
      const response = await fetch(`/api/cart/items/${id}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to remove item.");
        return;
      }

      setItems((current) => current.filter((item) => item.id !== id));
    } catch {
      setError("Unable to reach the cart service.");
    } finally {
      setRemovingId("");
    }
  }

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + (currency === "EUR" ? item.priceEUR : item.priceUSD), 0),
    [currency, items],
  );
  const summaryItems = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        image: item.service?.image,
        meta: item.service?.gameName,
        name: item.service?.title ?? "Service",
        price: formatMoney(currency === "EUR" ? item.priceEUR : item.priceUSD, currency),
      })),
    [currency, items],
  );

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />
      <section className="ms-shell grid gap-10 py-16 lg:grid-cols-[1fr_390px]">
        <div>
          <div className="flex flex-col justify-between gap-4 border-b border-[var(--ms-border)] pb-7 md:flex-row md:items-end">
            <div>
              <p className="mono text-xs uppercase tracking-[0.28em] text-[var(--ms-gradient-end)]">Cart</p>
              <h1 className="font-display mt-3 text-4xl font-black tracking-[-0.05em]">Your selected services</h1>
            </div>
            <Link href="/games" className="mono text-sm uppercase tracking-[0.22em] text-[var(--ms-gradient-end)]">
              Add more services
            </Link>
          </div>

          {error ? (
            <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          {isLoading ? (
            <div className="ms-card mt-8 rounded-xl p-10 text-center text-[var(--ms-body)]">Loading cart...</div>
          ) : items.length === 0 ? (
            <div className="ms-card mt-8 rounded-xl p-10 text-center">
              <h2 className="text-2xl font-black">Your cart is empty</h2>
              <p className="mt-3 text-[var(--ms-body)]">Choose a game service and configure your run first.</p>
              <Link href="/games" className="ms-button mt-8 inline-flex h-12 items-center px-6 mono">
                Browse Games
              </Link>
            </div>
          ) : (
            <div className="mt-8 space-y-5">
              {items.map((item) => {
                const price = currency === "EUR" ? item.priceEUR : item.priceUSD;
                const options = Object.entries(item.selectedOptionsSnapshot ?? {});

                return (
                  <article key={item.id} className="ms-card ms-card-hover rounded-xl p-5">
                    <div className="grid gap-5 md:grid-cols-[120px_1fr_auto]">
                      {item.service?.image ? (
                        <img src={item.service.image} alt="" className="h-28 rounded-md object-cover" />
                      ) : (
                        <PlaceholderAsset alt={`${item.service?.title ?? "Service"} preview`} className="h-28 rounded-md" imageClassName="p-4" />
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-xl font-black">{item.service?.title ?? "Service"}</h2>
                          <span className="rounded-full border border-[var(--ms-border)] px-3 py-1 mono text-xs text-[var(--ms-body)]">
                            {item.service?.gameName ?? "Game"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--ms-body)]">{item.service?.description}</p>
                        {options.length > 0 ? (
                          <div className="mt-4 grid gap-2 md:grid-cols-2">
                            {options.map(([label, snapshot]) => (
                              <div key={`${item.id}-${label}`} className="rounded-md border border-[var(--ms-border)] bg-[var(--ms-hover-bg)] px-3 py-2 text-sm">
                                <span className="text-[var(--ms-body)]">{label}: </span>
                                <span>{optionValue(snapshot.value)}</span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-row items-center justify-between gap-6 md:flex-col md:items-end">
                        <p className="mono text-xl text-[var(--ms-price)]">{formatMoney(price, currency)}</p>
                        <button
                          type="button"
                          disabled={removingId === item.id}
                          onClick={() => removeItem(item.id)}
                          className="text-sm text-[var(--ms-danger)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {removingId === item.id ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <OrderSummary
          ctaHref={items.length > 0 ? "/checkout" : undefined}
          ctaLabel={items.length > 0 ? "Proceed to Checkout" : undefined}
          items={summaryItems}
          rows={[]}
          serviceName={`${items.length} configured services`}
          serviceMeta={`Cart priced in ${currency}`}
          total={formatMoney(subtotal, currency)}
        />
      </section>
      <SiteFooter />
    </main>
  );
}
