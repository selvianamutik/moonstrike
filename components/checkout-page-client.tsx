"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { OrderSummary } from "@/components/order-summary";
import { CheckoutSkeleton } from "@/components/storefront-skeletons";
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

type PaymentSetting = {
  method: string;
  tax_rate: number;
  tax_label: string;
  enabled: boolean;
};

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
  const [paymentSettings, setPaymentSettings] = useState<PaymentSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingProvider, setSubmittingProvider] = useState<"nowpayments" | "paypal" | null>(null);
  const [error, setError] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<'paypal' | 'crypto'>('paypal');

  const handlePrimaryCheckout = () => {
    if (selectedPayment === 'paypal') handlePayPalCheckout();
    if (selectedPayment === 'crypto') handleCryptoCheckout();
  };

  useEffect(() => {
    let isMounted = true;

    async function loadCart() {
      setIsLoading(true);
      setError("");

      try {
        const [cartRes, settingsRes] = await Promise.all([
          fetch("/api/cart", { cache: "no-store" }),
          fetch("/api/payment-settings", { cache: "no-store" }),
        ]);

        const cartPayload = await cartRes.json().catch(() => ({}));
        if (!cartRes.ok) {
          if (isMounted) setError(cartPayload.error ?? "Unable to load cart.");
          return;
        }

        if (isMounted) {
          setItems(Array.isArray(cartPayload.items) ? cartPayload.items : []);
          const settings = await settingsRes.json().catch(() => []);
          setPaymentSettings(Array.isArray(settings) ? settings : []);
        }
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
  const taxInfo = useMemo(() => getTaxInfo(
    selectedPayment === "crypto" ? "nowpayments" : selectedPayment
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [selectedPayment, paymentSettings]);
  const taxAmount = useMemo(
    () => taxInfo ? Number((total * taxInfo.rate).toFixed(2)) : 0,
    [total, taxInfo],
  );
  const grandTotal = useMemo(() => total + taxAmount, [total, taxAmount]);
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

  function getTaxInfo(method: string) {
    const setting = paymentSettings.find((p) => p.method === method);
    if (!setting || !setting.enabled || !setting.tax_rate) return null;
    return { rate: setting.tax_rate, label: setting.tax_label || "Tax" };
  }

  async function handlePayPalCheckout() {
    setSubmittingProvider("paypal");
    setError("");

    try {
      const response = await fetch("/api/checkout/paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to create PayPal checkout.");
        return;
      }

      if (!payload.redirectTo) {
        setError("PayPal did not return a checkout URL.");
        return;
      }

      window.open(payload.redirectTo, "_blank", "noopener,noreferrer");
    } catch {
      setError("Unable to reach PayPal checkout service.");
    } finally {
      setSubmittingProvider(null);
    }
  }

  async function handleCryptoCheckout() {
    setSubmittingProvider("nowpayments");
    setError("");

    try {
      const response = await fetch("/api/checkout/nowpayments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to create crypto invoice.");
        return;
      }

      if (!payload.redirectTo) {
        setError("NOWPayments did not return a payment URL.");
        return;
      }

      window.open(payload.redirectTo, "_blank", "noopener,noreferrer");
    } catch {
      setError("Unable to reach crypto checkout service.");
    } finally {
      setSubmittingProvider(null);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <header className="border-b border-[var(--ms-border)]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-10">
          <Link href="/cart" className="text-sm text-[var(--ms-body)] hover:text-[var(--ms-gradient-end)] transition-colors">
            &larr; Back to Cart
          </Link>
          <Link href="/" className="text-2xl font-black">
            <span className="brand-gradient">Moon Strike</span>
          </Link>
          <span className="mono text-xs text-[var(--ms-body)]">{currency}</span>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 sm:px-10 py-10 sm:py-20">
        <h1 className="font-display text-3xl sm:text-4xl font-black">Secure Checkout</h1>
        <p className="mt-2 text-sm sm:text-base text-[var(--ms-body)]">Complete your transaction to dominate the game.</p>

        {error ? (
          <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
            {error}
          </p>
        ) : null}

        {isLoading ? (
          <CheckoutSkeleton />
        ) : items.length === 0 ? (
          <div className="ms-card mt-10 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-black">Your cart is empty</h2>
            <p className="mt-3 text-[var(--ms-body)]">Add a configured service before checkout.</p>
            <Link href="/games" className="ms-button mt-8 inline-flex h-12 items-center px-6 mono">
              Browse Games
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
            <div>
              <h2 className="text-2xl font-black">Payment Method</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  { id: "paypal" as const, method: "paypal", label: "PayPal", logo: "/payment/paypal.svg", desc: "PayPal, Visa, Mastercard, Apple Pay, Google Pay" },
                  { id: "crypto" as const, method: "nowpayments", label: "Crypto", logo: null, desc: "BTC, ETH, USDT & 100+ cryptocurrencies" },
                ].map((provider) => {
                  const tax = getTaxInfo(provider.method);
                  return (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => setSelectedPayment(provider.id)}
                      className={`relative flex flex-col items-center justify-center rounded-xl border p-6 transition-all duration-200 min-h-[150px] ${
                        selectedPayment === provider.id
                          ? "border-[var(--primary)] bg-[var(--ms-hover-bg)] shadow-[0_0_22px_rgba(136,82,255,0.22)]"
                          : "border-[var(--ms-border)] bg-[var(--ms-field)] hover:border-[var(--primary)] hover:bg-[var(--ms-hover-bg)]"
                      }`}
                    >
                      {provider.logo ? (
                        <Image src={provider.logo} alt={provider.label} width={100} height={36} className="object-contain h-9 w-auto" />
                      ) : (
                        <span className="text-base font-black tracking-wider text-[var(--ms-heading)]">CRYPTO</span>
                      )}
                      <p className="mt-2 text-xs text-[var(--ms-body)]">{provider.desc}</p>
                      {tax ? (
                        <span className="mono mt-2 text-[11px] uppercase tracking-[0.12em] text-[var(--ms-gradient-end)]">
                          +{(tax.rate * 100).toFixed(1)}% {tax.label}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={submittingProvider !== null}
                onClick={handlePrimaryCheckout}
                className="mt-6 w-full rounded-xl bg-[var(--primary)] py-4 text-center text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {selectedPayment === 'paypal' && (submittingProvider === 'paypal' ? 'Opening PayPal...' : 'Pay with PayPal')}
                {selectedPayment === 'crypto' && (submittingProvider === 'nowpayments' ? 'Opening Crypto...' : 'Pay with Crypto')}
              </button>

              <p className="mt-4 text-center text-xs text-[var(--ms-body)]">
                You will be redirected to the selected provider&apos;s hosted checkout.
              </p>
            </div>

            <div className="lg:sticky lg:top-10 self-start">
              <OrderSummary
                items={summaryItems}
                rows={taxInfo ? [
                  { label: "Subtotal", value: formatMoney(total, currency) },
                  { label: `${taxInfo.label} (${(taxInfo.rate * 100).toFixed(1)}%)`, value: formatMoney(taxAmount, currency) },
                ] : []}
                serviceName={`${items.length} configured services`}
                serviceMeta={`Checkout priced in ${currency}`}
                total={formatMoney(grandTotal, currency)}
              />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
