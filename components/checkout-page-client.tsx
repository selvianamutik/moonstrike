"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { OrderSummary } from "@/components/order-summary";
import { useCurrency } from "@/hooks/useCurrency";

type CheckoutCartItem = {
  id: string;
  priceUSD: number;
  priceEUR: number;
  service: {
    title: string;
    image: string;
    gameName: string;
  } | null;
};

const supportedPaymentMethods = [
  { label: "Stripe", logo: "/payment/stripe.svg" },
  { label: "Mastercard", logo: "/payment/master-card.svg" },
  { label: "Apple Pay", logo: "/payment/apple-pay.svg" },
  { label: "Google Pay", logo: "/payment/google-pay.svg" },
  { label: "PayPal", logo: "/payment/paypal.svg" },
  { label: "Visa" },
  { label: "Link" },
  { label: "Bank" },
];

function formatMoney(value: number, currency: "USD" | "EUR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function CheckoutPageClient() {
  const { currency } = useCurrency();
  const [items, setItems] = useState<CheckoutCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadCart() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/cart", { cache: "no-store" });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          if (isMounted) setError(payload.error ?? "Unable to load cart.");
          return;
        }

        if (isMounted) setItems(Array.isArray(payload.items) ? payload.items : []);
      } catch {
        if (isMounted) setError("Unable to reach the cart service.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadCart();

    return () => {
      isMounted = false;
    };
  }, []);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + (currency === "EUR" ? item.priceEUR : item.priceUSD), 0),
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

  async function handleStripeCheckout() {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to place this order.");
        return;
      }

      if (!payload.redirectTo) {
        setError("Stripe did not return a checkout URL.");
        return;
      }

      window.location.href = payload.redirectTo;
    } catch {
      setError("Unable to reach checkout service.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <header className="border-b border-[var(--ms-border)]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-10">
          <Link href="/cart" className="text-[var(--ms-body)]">
            Back to Cart
          </Link>
          <Link href="/" className="text-2xl font-black">
            <span className="brand-gradient">Moon Strike</span>
          </Link>
          <span className="mono text-xs text-[var(--ms-body)]">{currency}</span>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-10 py-20 lg:grid-cols-[1fr_450px]">
        <div>
          <h1 className="font-display text-4xl font-black">Secure Checkout</h1>
          <p className="mt-4 text-[var(--ms-body)]">Complete your transaction to dominate the game.</p>

          {error ? (
            <p className="mt-8 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          {isLoading ? (
            <div className="ms-card mt-12 rounded-xl p-8 text-[var(--ms-body)]">Loading checkout...</div>
          ) : items.length === 0 ? (
            <div className="ms-card mt-12 rounded-xl p-8">
              <h2 className="text-2xl font-black">Your cart is empty</h2>
              <p className="mt-3 text-[var(--ms-body)]">Add a configured service before checkout.</p>
              <Link href="/games" className="ms-button mt-8 inline-flex h-12 items-center px-6 mono">
                Browse Games
              </Link>
            </div>
          ) : (
            <>
              <h2 className="mt-12 text-2xl font-black">Payment Method</h2>
              <div className="ms-card mt-6 rounded-xl p-8">
                <div className="rounded-md border border-[var(--primary)] bg-[var(--ms-hover-bg)] p-5 shadow-[0_0_22px_rgba(136,82,255,0.22)]">
                  <h3 className="text-xl font-black">Stripe Checkout</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--ms-body)]">
                    Continue to Stripe's hosted test checkout to complete payment securely.
                  </p>
                </div>
                <div className="mt-6">
                  <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--ms-body)]">
                    Eligible methods may include
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {supportedPaymentMethods.map((method) => (
                      <div
                        key={method.label}
                        className="flex h-16 items-center justify-center rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] px-3"
                        aria-label={method.label}
                        title={method.label}
                      >
                        {method.logo ? (
                          <img src={method.logo} alt={method.label} className="max-h-7 max-w-full object-contain" />
                        ) : (
                          <span className="text-center text-sm font-black">{method.label}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[var(--ms-body)]">
                    Stripe shows the final available methods based on your device, region, currency, and Dashboard settings.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleStripeCheckout}
                  className="ms-button mt-8 h-14 w-full text-lg font-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Opening Stripe..." : "Pay with Stripe Sandbox"}
                </button>
                <p className="mt-4 text-center text-xs text-[var(--ms-body)]">
                  You will be redirected to Stripe Checkout in test mode.
                </p>
              </div>
            </>
          )}
        </div>

        <OrderSummary
          items={summaryItems}
          rows={[]}
          serviceName={`${items.length} configured services`}
          serviceMeta={`Checkout priced in ${currency}`}
          total={formatMoney(total, currency)}
        />
      </section>
    </main>
  );
}
