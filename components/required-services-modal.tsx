"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ServiceOption } from "@/lib/cms/services";
import type { Currency } from "@/hooks/useCurrency";

export type RequiredServiceItem = {
  id: string;
  title: string;
  slug: string;
  image: string | null;
  basePriceUSD: number;
  basePriceEUR: number;
  optionsSchema: ServiceOption[];
  gameSlug: string;
  serviceCategorySlug: string | null;
  requirementText: string;
};

function formatMoney(value: number, currency: Currency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function RequiredServicesModal({
  services,
  currency,
  submitting = false,
  onCancel,
  onConfirm,
}: {
  services: RequiredServiceItem[];
  currency: Currency;
  submitting?: boolean;
  onCancel: () => void;
  onConfirm: (serviceIds: string[]) => void;
}) {
  const [owned, setOwned] = useState<Record<string, boolean>>({});

  const addedIds = useMemo(
    () => services.filter((item) => !owned[item.id]).map((item) => item.id),
    [owned, services]
  );
  const addedTotal = useMemo(
    () =>
      services
        .filter((item) => !owned[item.id])
        .reduce(
          (total, item) => total + (currency === "EUR" ? item.basePriceEUR : item.basePriceUSD),
          0
        ),
    [currency, owned, services]
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onCancel, submitting]);

  function toggleOwned(id: string) {
    setOwned((current) => ({ ...current, [id]: !current[id] }));
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close required services dialog"
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
        onClick={() => {
          if (!submitting) onCancel();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Required services"
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
      >
        <div className="h-1 shrink-0 bg-[var(--ms-cta-bg)]" />
        <div className="flex items-start justify-between gap-4 border-b border-[var(--ms-border)] p-6">
          <div>
            <p className="mono text-xs uppercase tracking-[0.2em] text-[var(--ms-gradient-end)]">
              Required Services
            </p>
            <h2 className="mt-2 text-lg font-bold text-[var(--ms-heading)]">
              This service needs prerequisites
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--ms-body)]">
              Check any service you already own to skip it. Unchecked services will be added to your
              cart.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!submitting) onCancel();
            }}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-[var(--ms-border)] text-lg leading-none text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-heading)]"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-6">
          {services.map((item) => {
            const isOwned = Boolean(owned[item.id]);
            return (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-lg border border-[var(--ms-border)] bg-[var(--ms-bg-page)] p-4"
              >
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />
                ) : (
                  <div className="h-14 w-14 shrink-0 rounded-md bg-[var(--ms-cta-bg)]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--ms-heading)]">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--ms-body)]">
                    {item.requirementText}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="mono text-sm text-[var(--ms-price)]">
                      {formatMoney(currency === "EUR" ? item.basePriceEUR : item.basePriceUSD, currency)}
                    </span>
                    {item.gameSlug && item.slug ? (
                      <Link
                        href={
                          item.serviceCategorySlug
                            ? `/${item.gameSlug}/${item.serviceCategorySlug}/${item.slug}`
                            : `/services/${item.gameSlug}/${item.slug}`
                        }
                        className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--ms-gradient-end)] hover:text-[var(--ms-heading)]"
                      >
                        View
                      </Link>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isOwned}
                  onClick={() => toggleOwned(item.id)}
                  className={`flex shrink-0 flex-col items-center gap-2 rounded-md border px-3 py-2 transition-colors ${
                    isOwned
                      ? "border-[var(--ms-gradient-end)] bg-[var(--ms-hover-bg)]"
                      : "border-[var(--ms-border)] hover:border-[var(--ms-gradient-end)]"
                  }`}
                >
                  <span
                    className={`grid h-4 w-4 place-items-center rounded-sm border ${
                      isOwned
                        ? "border-[var(--ms-gradient-end)] bg-[var(--ms-gradient-end)]"
                        : "border-[var(--ms-border)]"
                    }`}
                    aria-hidden="true"
                  >
                    {isOwned ? <span className="text-[10px] font-bold leading-none text-white">✓</span> : null}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--ms-body)]">
                    {isOwned ? "Owned" : "Own it?"}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="shrink-0 border-t border-[var(--ms-border)] p-6">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-[var(--ms-body)]">
              {addedIds.length === 0
                ? "No additional services will be added."
                : `${addedIds.length} of ${services.length} service${
                    services.length > 1 ? "s" : ""
                  } will be added to your cart.`}
            </span>
            {addedTotal > 0 ? (
              <span className="mono shrink-0 text-[var(--ms-price)]">+ {formatMoney(addedTotal, currency)}</span>
            ) : null}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={onCancel}
              className="mono h-12 rounded-md border border-[var(--ms-border)] text-xs font-bold uppercase tracking-[0.14em] text-[var(--ms-heading)] transition-colors hover:bg-[var(--ms-hover-bg)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              autoFocus
              onClick={() => onConfirm(addedIds)}
              className="ms-button mono h-12 text-xs font-bold uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Adding..." : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}