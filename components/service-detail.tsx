"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PlaceholderAsset } from "@/components/asset-image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui";
import { CustomerRangeSlider } from "@/components/CustomerRangeSlider";
import { useCurrency, type Currency } from "@/hooks/useCurrency";
import { notifyCartUpdated } from "@/lib/cart-events";
import type { RangePairValue, ServiceOption, ServiceRow } from "@/lib/cms/services";
import type { ServiceRequirement } from "@/lib/cms/service-requirements";
import { RequiredServicesModal, type RequiredServiceItem } from "@/components/required-services-modal";
import "@/app/customer-range-slider.css";

function optionLabel(option: ServiceOption) {
  if (option.type === "dropdown") return "Dropdown";
  if (option.type === "radio" || option.type === "single_choice") return "Single Choice";
  if (option.type === "checkbox_group" || option.type === "multiple_choice") return "Multiple Choice";
  if (option.type === "range") return "Range";
  if (option.type === "range_pair") return "Custom Range";
  if (option.type === "number_stepper" || option.type === "scalar") return "Stepper";
  if (option.type === "quantity") return "Quantity";
  if (option.type === "toggle") return "Toggle";
  if (option.type === "textarea") return "Long Text";
  if (option.type === "text") return "Text";
  return "Quantity";
}

type SelectionValue = string | string[] | number | boolean | RangePairValue;

function isMultiChoice(option: ServiceOption) {
  return option.type === "multiple_choice" || option.type === "checkbox_group";
}

function isChoice(option: ServiceOption) {
  return option.type === "single_choice" || option.type === "multiple_choice" || option.type === "dropdown" || option.type === "radio" || option.type === "checkbox_group";
}

function isQuantity(option: ServiceOption) {
  return option.type === "scalar" || option.type === "range" || option.type === "number_stepper";
}

function isRangePair(option: ServiceOption) {
  return option.type === "range_pair";
}

function isQuantityOption(option: ServiceOption) {
  return option.type === "quantity";
}

function isRangePairValue(value: SelectionValue | undefined): value is RangePairValue {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "start" in value &&
    "end" in value
  );
}

function getDefaultSelection(option: ServiceOption): SelectionValue {
  if (isMultiChoice(option)) return [];
  if (isQuantityOption(option)) return option.min ?? 1;
  if (isQuantity(option)) return option.min ?? 1;
  if (isRangePair(option)) {
    return { start: option.min ?? 1, end: option.max ?? (option.min ?? 1) + 1 };
  }
  if (option.type === "toggle") return false;
  if (option.type === "text" || option.type === "textarea") return "";
  return option.options?.[0]?.label ?? "";
}

function getRangeSelection(option: ServiceOption, selections: Record<string, SelectionValue>): RangePairValue {
  const value = selections[option.label] ?? getDefaultSelection(option);
  return isRangePairValue(value) ? value : (getDefaultSelection(option) as RangePairValue);
}

function defaultSelectionsForOptions(options: ServiceOption[]) {
  return Object.fromEntries(options.map((option) => [option.label, getDefaultSelection(option)]));
}

function isOptionFulfilled(option: ServiceOption, value: SelectionValue | undefined) {
  if (!option.required) return true;
  if (option.type === "text" || option.type === "textarea") {
    return typeof value === "string" && value.trim().length > 0;
  }
  if (isMultiChoice(option)) {
    return Array.isArray(value) && value.length > 0;
  }
  if (isRangePair(option)) {
    return isRangePairValue(value) && Number.isFinite(Number(value.start)) && Number.isFinite(Number(value.end));
  }
  return value !== undefined && value !== null && value !== "";
}

function formatMoney(value: number, currency: Currency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

function calculateOptionTotal(option: ServiceOption, value: SelectionValue, currency: Currency) {
  if (isQuantityOption(option)) return 0;

  if (isRangePair(option)) {
    const unitPrice = currency === "EUR" ? option.pricePerUnitEUR ?? 0 : option.pricePerUnitUSD ?? 0;
    const range = isRangePairValue(value) ? value : { start: 0, end: 0 };
    return Math.max(0, (Number(range.end) || 0) - (Number(range.start) || 0)) * unitPrice;
  }

  if (isQuantity(option)) {
    const unitPrice = currency === "EUR" ? option.pricePerUnitEUR ?? 0 : option.pricePerUnitUSD ?? 0;
    return (Number(value) || 0) * unitPrice;
  }

  if (isMultiChoice(option)) {
    const selected = Array.isArray(value) ? value : [];
    return (option.options ?? [])
      .filter((item) => selected.includes(item.label))
      .reduce((total, item) => total + (currency === "EUR" ? (item.priceEUR ?? 0) : item.priceUSD), 0);
  }

  if (option.type === "toggle") {
    return value === true ? (currency === "EUR" ? option.priceEUR ?? 0 : option.priceUSD ?? 0) : 0;
  }

  if (!isChoice(option)) return 0;

  const selected = option.options?.find((item) => item.label === value);
  return selected ? (currency === "EUR" ? (selected.priceEUR ?? 0) : selected.priceUSD) : 0;
}

function optionPrice(option: ServiceOption, currency: Currency) {
  return currency === "EUR" ? option.priceEUR ?? 0 : option.priceUSD ?? 0;
}

function choicePrice(item: { priceUSD: number; priceEUR?: number }, currency: Currency) {
  return currency === "EUR" ? (item.priceEUR ?? 0) : item.priceUSD;
}

function ServiceOptions({
  options,
  selections,
  currency,
  flashLabels,
  onChange,
}: {
  options: ServiceOption[];
  selections: Record<string, SelectionValue>;
  currency: Currency;
  flashLabels: string[];
  onChange: (key: string, value: SelectionValue) => void;
}) {
  if (options.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-5">
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--ms-body)]">Configuration</p>
        <p className="mt-3 text-sm leading-6 text-[var(--ms-body)]">
          This service uses the flat base price.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {options.map((option, index) => (
        <div
          key={`${option.label}-${index}`}
          className={`rounded-xl border bg-[var(--ms-bg-card)] p-5 ${
            flashLabels.includes(option.label)
              ? "border-red-500 animate-[ms-required-flash_0.6s_ease-in-out_3]"
              : "border-[var(--ms-border)]"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium text-[var(--ms-heading)]">{option.label}</p>
            <span className="mono text-xs uppercase tracking-[0.16em] text-[var(--ms-gradient-end)]">
              {optionLabel(option)}
            </span>
          </div>
          {option.type === "quantity" ? (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-[var(--ms-border)] p-2">
              <button
                type="button"
                onClick={() => {
                  const current = Number(selections[option.label] ?? getDefaultSelection(option));
                  onChange(option.label, Math.max(option.min ?? 1, current - 1));
                }}
                className="h-10 w-10 rounded-md border border-[var(--ms-border)] text-lg hover:border-[var(--ms-gradient-end)]"
                aria-label={`Decrease ${option.label}`}
              >
                -
              </button>
              <span className="mono min-w-16 text-center text-sm text-[var(--ms-heading)]">
                {Number(selections[option.label] ?? getDefaultSelection(option))}
              </span>
              <button
                type="button"
                onClick={() => {
                  const current = Number(selections[option.label] ?? getDefaultSelection(option));
                  const rawNext = current + 1;
                  onChange(option.label, option.max ? Math.min(option.max, rawNext) : rawNext);
                }}
                className="h-10 w-10 rounded-md border border-[var(--ms-border)] text-lg hover:border-[var(--ms-gradient-end)]"
                aria-label={`Increase ${option.label}`}
              >
                +
              </button>
            </div>
          ) : option.type === "range" ? (
            <div className="mt-4">
              <input
                type="range"
                min={option.min ?? 1}
                max={option.max}
                step={option.step ?? 1}
                value={Number(selections[option.label] ?? getDefaultSelection(option))}
                onChange={(event) => onChange(option.label, Number(event.target.value))}
                className="h-12 w-full accent-[var(--ms-gradient-end)]"
                aria-label={option.label}
              />
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[var(--ms-body)]">
                <input
                  type="number"
                  min={option.min ?? 1}
                  max={option.max}
                  step={option.step ?? 1}
                  value={Number(selections[option.label] ?? getDefaultSelection(option))}
                  onChange={(event) => {
                    const val = Number(event.target.value);
                    if (!isNaN(val)) {
                      const clamped = Math.max(option.min ?? 1, Math.min(option.max ?? val, val));
                      onChange(option.label, clamped);
                    }
                  }}
                  className="h-10 w-24 rounded-md border border-[var(--ms-border)] bg-transparent px-3 text-center text-sm outline-none focus:border-[var(--ms-gradient-end)]"
                />
                <span className="mono text-[var(--ms-price)]">
                  + {formatMoney(calculateOptionTotal(option, selections[option.label] ?? getDefaultSelection(option), currency), currency)}
                </span>
              </div>
            </div>
          ) : option.type === "range_pair" ? (
            <div className="mt-4">
              <CustomerRangeSlider
                min={option.min ?? 1}
                max={option.max ?? 10}
                step={option.step ?? 1}
                value={[getRangeSelection(option, selections).start, getRangeSelection(option, selections).end]}
                onChange={(newRange) => {
                  onChange(option.label, { start: newRange[0], end: newRange[1] });
                }}
                label={option.label}
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={option.min ?? 1}
                    max={getRangeSelection(option, selections).end}
                    step={option.step ?? 1}
                    value={getRangeSelection(option, selections).start}
                    onChange={(event) => {
                      const range = getRangeSelection(option, selections);
                      const val = Number(event.target.value);
                      if (!isNaN(val)) {
                        onChange(option.label, { ...range, start: Math.max(option.min ?? 1, Math.min(range.end, val)) });
                      }
                    }}
                    className="mono h-10 w-20 rounded-md border border-[var(--ms-border)] bg-transparent px-3 text-center text-sm text-[var(--ms-heading)] outline-none focus:border-[var(--ms-gradient-end)]"
                    aria-label={`${option.label} start value`}
                  />
                  <span className="text-sm text-[var(--ms-body)]">to</span>
                  <input
                    type="number"
                    min={getRangeSelection(option, selections).start}
                    max={option.max}
                    step={option.step ?? 1}
                    value={getRangeSelection(option, selections).end}
                    onChange={(event) => {
                      const range = getRangeSelection(option, selections);
                      const val = Number(event.target.value);
                      if (!isNaN(val)) {
                        onChange(option.label, { ...range, end: Math.max(range.start, Math.min(option.max ?? val, val)) });
                      }
                    }}
                    className="mono h-10 w-20 rounded-md border border-[var(--ms-border)] bg-transparent px-3 text-center text-sm text-[var(--ms-heading)] outline-none focus:border-[var(--ms-gradient-end)]"
                    aria-label={`${option.label} end value`}
                  />
                </div>
                <span className="mono text-[var(--ms-price)]">
                  + {formatMoney(calculateOptionTotal(option, selections[option.label] ?? getDefaultSelection(option), currency), currency)}
                </span>
              </div>
            </div>
          ) : option.type === "number_stepper" || option.type === "scalar" ? (
            <div className="mt-4">
              <div className="flex items-center justify-between gap-3 rounded-md border border-[var(--ms-border)] p-2">
                <button
                  type="button"
                  onClick={() => {
                    const current = Number(selections[option.label] ?? getDefaultSelection(option));
                    const next = Math.max(option.min ?? 1, current - 1);
                    onChange(option.label, next);
                  }}
                  className="h-10 w-10 rounded-md border border-[var(--ms-border)] text-lg hover:border-[var(--ms-gradient-end)]"
                  aria-label={`Decrease ${option.label}`}
                >
                  -
                </button>
                <input
                  type="number"
                  min={option.min ?? 1}
                  max={option.max}
                  step={option.step ?? 1}
                  value={Number(selections[option.label] ?? getDefaultSelection(option))}
                  onChange={(event) => {
                    const val = Number(event.target.value);
                    if (!isNaN(val)) {
                      const clamped = Math.max(option.min ?? 1, option.max ? Math.min(option.max, val) : val);
                      onChange(option.label, clamped);
                    }
                  }}
                  className="mono h-10 w-24 rounded-md border border-[var(--ms-border)] bg-transparent text-center text-sm text-[var(--ms-heading)] outline-none focus:border-[var(--ms-gradient-end)]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const current = Number(selections[option.label] ?? getDefaultSelection(option));
                    const rawNext = current + 1;
                    const next = option.max ? Math.min(option.max, rawNext) : rawNext;
                    onChange(option.label, next);
                  }}
                  className="h-10 w-10 rounded-md border border-[var(--ms-border)] text-lg hover:border-[var(--ms-gradient-end)]"
                  aria-label={`Increase ${option.label}`}
                >
                  +
                </button>
              </div>
              <div className="mt-2 flex justify-end text-xs">
                <span className="mono text-[var(--ms-price)]">
                  + {formatMoney(calculateOptionTotal(option, selections[option.label] ?? getDefaultSelection(option), currency), currency)}
                </span>
              </div>
            </div>
          ) : option.type === "toggle" ? (
            <button
              type="button"
              onClick={() => onChange(option.label, !(selections[option.label] ?? getDefaultSelection(option)))}
              className={`mt-4 flex w-full items-center justify-between gap-4 rounded-md border px-4 py-3 text-left text-sm hover:border-[var(--ms-gradient-end)] ${
                selections[option.label] === true
                  ? "border-[var(--ms-gradient-end)] bg-[var(--ms-hover-bg)]"
                  : "border-[var(--ms-border)]"
              }`}
            >
              <span>{selections[option.label] === true ? option.enabledLabel ?? "Yes" : option.disabledLabel ?? "No"}</span>
              <span
                className={`relative h-6 w-11 rounded-full border transition-colors ${
                  selections[option.label] === true
                    ? "border-[var(--ms-gradient-end)] bg-[var(--ms-gradient-end)]"
                    : "border-[var(--ms-border)] bg-transparent"
                }`}
                aria-hidden="true"
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-[var(--ms-heading)] transition-transform ${
                    selections[option.label] === true ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </span>
              <span className="mono text-[var(--ms-price)]">
                + {formatMoney(optionPrice(option, currency), currency)}
              </span>
            </button>
          ) : option.type === "text" || option.type === "textarea" ? (
            option.type === "textarea" ? (
              <textarea
                value={String(selections[option.label] ?? "")}
                onChange={(event) => onChange(option.label, event.target.value)}
                placeholder={option.placeholder}
                className="mt-4 min-h-28 w-full rounded-md border border-[var(--ms-border)] bg-transparent px-4 py-3 text-sm outline-none focus:border-[var(--ms-gradient-end)]"
              />
            ) : (
              <input
                type="text"
                value={String(selections[option.label] ?? "")}
                onChange={(event) => onChange(option.label, event.target.value)}
                placeholder={option.placeholder}
                className="mt-4 h-12 w-full rounded-md border border-[var(--ms-border)] bg-transparent px-4 text-sm outline-none focus:border-[var(--ms-gradient-end)]"
              />
            )
          ) : option.type === "dropdown" ? (
            <select
              value={String(selections[option.label] ?? getDefaultSelection(option))}
              onChange={(event) => onChange(option.label, event.target.value)}
              className="mt-4 h-12 w-full rounded-md border border-[var(--ms-border)] bg-[var(--ms-bg-page)] px-4 pr-10 text-sm outline-none focus:border-[var(--ms-gradient-end)]"
            >
              {(option.options ?? []).map((item) => (
                <option key={item.label} value={item.label}>
                  {item.label} (+ {formatMoney(choicePrice(item, currency), currency)})
                </option>
              ))}
            </select>
          ) : (
            <div className="mt-4 grid gap-2">
              {(option.options ?? []).map((item) => {
                const currentSelection = selections[option.label];
                const isSelected =
                  isMultiChoice(option)
                    ? Array.isArray(currentSelection) && currentSelection.includes(item.label)
                    : currentSelection === item.label;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      const current = selections[option.label] ?? getDefaultSelection(option);

                      if (isMultiChoice(option)) {
                        const selected = Array.isArray(current) ? current : [];
                        onChange(
                          option.label,
                          selected.includes(item.label)
                            ? selected.filter((value) => value !== item.label)
                            : [...selected, item.label]
                        );
                        return;
                      }

                      onChange(option.label, item.label);
                    }}
                    className={`flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-left text-sm hover:border-[var(--ms-gradient-end)] ${
                      isSelected
                        ? "border-[var(--ms-gradient-end)] bg-[var(--ms-hover-bg)]"
                        : "border-[var(--ms-border)]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`grid h-4 w-4 shrink-0 place-items-center border ${
                          isMultiChoice(option) ? "rounded-sm" : "rounded-full"
                        } ${isSelected ? "border-[var(--ms-gradient-end)]" : "border-[var(--ms-border)]"}`}
                        aria-hidden="true"
                      >
                        {isSelected ? (
                          <span
                            className={`h-2 w-2 bg-[var(--ms-gradient-end)] ${
                              isMultiChoice(option) ? "rounded-[2px]" : "rounded-full"
                            }`}
                          />
                        ) : null}
                      </span>
                      {item.label}
                    </span>
                    <span className="mono text-[var(--ms-price)]">
                      + {formatMoney(choicePrice(item, currency), currency)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function ServiceDetail({
  previewMode = false,
  service,
  showSiteChrome = true,
}: {
  previewMode?: boolean;
  service: ServiceRow;
  showSiteChrome?: boolean;
}) {
  const router = useRouter();
  const { currency, setCurrency } = useCurrency();
  const [cartStatus, setCartStatus] = useState<"idle" | "adding" | "buying">("idle");
  const [cartMessage, setCartMessage] = useState("");
  const [flashLabels, setFlashLabels] = useState<string[]>([]);
  const [selections, setSelections] = useState<Record<string, SelectionValue>>(() =>
    Object.fromEntries(service.options_schema.map((option) => [option.label, getDefaultSelection(option)]))
  );
  const [requiredModal, setRequiredModal] = useState<{
    items: RequiredServiceItem[];
    nextAction: "stay" | "cart";
  } | null>(null);
  const quantityOption = service.options_schema.find(isQuantityOption);
  const quantity = quantityOption ? Number(selections[quantityOption.label] ?? getDefaultSelection(quantityOption)) || 1 : 1;
  const missingRequired = useMemo(
    () =>
      service.options_schema
        .filter((option) => !isOptionFulfilled(option, selections[option.label]))
        .map((option) => option.label),
    [selections, service.options_schema]
  );
  const isConfigComplete = missingRequired.length === 0;
  const optionsTotal = useMemo(
    () =>
      service.options_schema.reduce(
        (total, option) =>
          total + calculateOptionTotal(option, selections[option.label] ?? getDefaultSelection(option), currency),
        0
      ),
    [currency, selections, service.options_schema]
  );
  const basePrice = currency === "EUR" ? service.base_price_eur : service.base_price_usd;
  const unitTotal = basePrice + optionsTotal;
  const total = unitTotal * quantity;

  async function fetchRequiredServiceItems(refs: ServiceRequirement[]) {
    const results = await Promise.all(
      refs.map(async (ref) => {
        if (!ref.serviceId) return null;
        try {
          const response = await fetch(`/api/services/${ref.serviceId}`);
          if (!response.ok) return null;
          const data = await response.json();
          return { ...data, requirementText: ref.text } as RequiredServiceItem;
        } catch {
          return null;
        }
      })
    );
    return results.filter((item): item is RequiredServiceItem => Boolean(item));
  }

  async function submitCartItems(
    items: Array<{ serviceId: string; selectedOptions: Record<string, SelectionValue> }>,
    nextAction: "stay" | "cart"
  ) {
    if (cartStatus !== "idle") return;

    setCartMessage("");
    setCartStatus(nextAction === "cart" ? "buying" : "adding");

    try {
      const results = await Promise.all(
        items.map(async (item) => {
          const response = await fetch("/api/cart/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          });
          const payload = await response.json().catch(() => ({}));
          return { ok: response.ok, payload };
        })
      );

      const failed = results.filter((result) => !result.ok);
      if (failed.length > 0) {
        const message = failed[0]?.payload?.error;
        setCartMessage(
          typeof message === "string" ? message : `Unable to add ${failed.length} item(s) to cart.`
        );
        return;
      }

      notifyCartUpdated();

      if (nextAction === "cart") {
        router.push("/cart");
        return;
      }

      setCartMessage("Added to cart.");
      router.refresh();
    } catch {
      setCartMessage("Unable to reach the cart service.");
    } finally {
      setCartStatus("idle");
    }
  }

  async function handleRequiredConfirm(serviceIds: string[]) {
    if (!requiredModal) return;

    const { items, nextAction } = requiredModal;
    const added = items.filter((item) => serviceIds.includes(item.id));

    await submitCartItems(
      [
        { serviceId: service.id, selectedOptions: selections },
        ...added.map((item) => ({
          serviceId: item.id,
          selectedOptions: defaultSelectionsForOptions(item.optionsSchema),
        })),
      ],
      nextAction
    );
    setRequiredModal(null);
  }

  async function addToCart(nextAction: "stay" | "cart") {
    if (previewMode || cartStatus !== "idle") return;

    if (!isConfigComplete) {
      setCartMessage("Please complete all required options to continue.");
      setFlashLabels(missingRequired);
      window.setTimeout(() => setFlashLabels([]), 1800);
      return;
    }

    const requiredRefs = Array.from(
      new Map(
        service.requirements.filter((ref) => ref.serviceId).map((ref) => [ref.serviceId!, ref])
      ).values()
    );

    if (requiredRefs.length > 0) {
      const items = await fetchRequiredServiceItems(requiredRefs);
      if (items.length > 0) {
        setRequiredModal({ items, nextAction });
        return;
      }
    }

    await submitCartItems([{ serviceId: service.id, selectedOptions: selections }], nextAction);
  }

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      {showSiteChrome ? <SiteHeader /> : null}
      {previewMode ? (
        <div className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-3 text-center text-sm font-medium text-amber-700 dark:text-amber-200">
          PREVIEW MODE - This service is not yet published.
        </div>
      ) : null}
      <section className="ms-shell grid gap-8 py-10 sm:py-16 lg:gap-12 lg:py-20 lg:grid-cols-[1fr_minmax(0,390px)]">
        <div>
          <nav className="mono text-xs uppercase tracking-[0.22em] text-[var(--ms-gradient-end)]">
            <Link href={`/${service.game_slug}`} className="hover:text-[var(--ms-heading)]">
              {service.game_name}
            </Link>
            <span className="mx-3 text-[var(--ms-body)]">/</span>
            <span>{service.service_category_name ?? "Service"}</span>
          </nav>
          <h1 className="font-display mt-5 text-4xl font-black tracking-[-0.04em] sm:text-5xl">{service.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--ms-body)]">{service.description}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            {service.service_category_name ? <Badge variant="featured">{service.service_category_name}</Badge> : null}
            {service.badges.map((badge) => (
              <Badge key={badge} variant="new">
                {badge}
              </Badge>
            ))}
          </div>
          {service.image ? (
            <div className="relative mt-12 h-[220px] overflow-hidden rounded-lg border border-[var(--ms-border)] sm:h-[300px] md:h-[380px]">
              <img src={service.image} alt={`${service.title} preview`} className="h-full w-full object-cover" />
            </div>
          ) : (
            <PlaceholderAsset
              isHidden={false}
              alt={`${service.title} service preview`}
              className="mt-12 h-[220px] rounded-lg border border-[var(--ms-border)] sm:h-[300px] md:h-[380px]"
              priority
              imageClassName="p-20"
            />
          )}

          <h2 className="mt-12 border-b border-[var(--ms-border)] pb-5 text-base font-medium">What You Get</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {service.what_you_get.map((benefit, index) => (
              <article key={`${benefit.title}-${index}`} className="ms-card ms-card-hover rounded-lg p-6">
                <div className="flex gap-5">
                  <span className="mono flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[var(--ms-hover-bg)] text-sm font-bold text-[var(--ms-gradient-end)]">
                    MS
                  </span>
                  <div>
                    <h3 className="mono text-base text-[var(--ms-heading)]">{benefit.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--ms-body)]">{benefit.description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <h2 className="mt-12 border-b border-[var(--ms-border)] pb-5 text-base font-medium">Requirements</h2>
          <ul className="mt-6 space-y-5 text-[var(--ms-body)]">
            {service.requirements.map((item) => (
              <li key={`${item.text}-${item.serviceId ?? item.serviceSlug ?? ""}`} className="flex flex-col gap-3 rounded-lg border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-4 sm:flex-row sm:items-center">
                <span className="text-[var(--ms-danger)]">-</span>
                <span className="flex-1">{item.text}</span>
                {item.gameSlug && item.serviceSlug ? (
                  <Link
                    href={
                      item.serviceCategorySlug
                        ? `/${item.gameSlug}/${item.serviceCategorySlug}/${item.serviceSlug}`
                        : `/services/${item.gameSlug}/${item.serviceSlug}`
                    }
                    className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--ms-border)] px-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--ms-heading)] transition-colors hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-gradient-end)]"
                  >
                    {item.serviceTitle ? `Open ${item.serviceTitle}` : "Open service"}
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>

          <section className="ms-card mt-16 rounded-xl p-8 md:p-12">
            <p className="mono text-xs uppercase tracking-[0.24em] text-[var(--ms-gradient-end)]">Why Choose Us</p>
            <h2 className="font-display mt-4 max-w-xl text-4xl font-black leading-tight tracking-[-0.04em]">
              Verified delivery for every order
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                ["Verified Pros", "Orders are handled by screened boosters with relevant game experience."],
                ["Clear Updates", "Progress stays visible from checkout through completion."],
                ["Support Ready", "Support is available if your order needs guidance or adjustment."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-lg border border-[var(--ms-border)] p-5">
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--ms-body)]">{body}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="ms-card h-fit rounded-xl p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] order-first lg:order-last lg:sticky lg:top-32">
          <h2 className="text-lg font-medium">Configure Your Run</h2>
          {/* <div className="mt-6 inline-flex rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-1">
            {(["USD", "EUR"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCurrency(option)}
                className={`h-9 rounded-full px-4 mono text-xs font-bold uppercase leading-9 tracking-[0.18em] transition-colors ${
                  currency === option
                    ? "bg-[var(--primary)] text-[var(--ms-heading)] shadow-[0_0_18px_rgba(139,92,246,0.35)]"
                    : "text-[var(--ms-body)] hover:text-[var(--ms-heading)]"
                }`}
              >
                {option}
              </button>
            ))}
          </div> */}
          <div className="mt-8">
            <ServiceOptions
              options={service.options_schema}
              selections={selections}
              currency={currency}
              flashLabels={flashLabels}
              onChange={(key, value) => setSelections((current) => ({ ...current, [key]: value }))}
            />
          </div>
          <div className="mt-8 border-t border-[var(--ms-border)] pt-8">
            <p className="mono text-right text-sm uppercase tracking-[0.18em] text-[var(--ms-body)]">
              {currency}
            </p>
            <div className="mt-8 flex justify-between text-sm">
              <span className="text-[var(--ms-body)]">Base Price</span>
              <span className="mono text-[var(--ms-price)]">{formatMoney(basePrice, currency)}</span>
            </div>
            {optionsTotal > 0 ? (
              <div className="mt-3 flex justify-between text-sm">
                <span className="text-[var(--ms-body)]">Options</span>
                <span className="mono text-[var(--ms-price)]">+ {formatMoney(optionsTotal, currency)}</span>
              </div>
            ) : null}
            {quantityOption && quantity > 1 ? (
              <div className="mt-6 border-t border-[var(--ms-border)] pt-5">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--ms-body)]">Unit Price</span>
                  <span className="mono text-[var(--ms-price)]">{formatMoney(unitTotal, currency)}</span>
                </div>
              </div>
            ) : null}
            <div className="mt-6 flex justify-between border-t border-[var(--ms-border)] pt-5 text-base">
              <span className="text-[var(--ms-heading)]">Total Price</span>
              <span className="mono text-xl font-bold text-[var(--ms-price)]">{formatMoney(total, currency)}</span>
            </div>
            <div className="mt-7 grid gap-3">
              {previewMode ? (
                <>
                  <button
                    type="button"
                    disabled
                    className="h-12 rounded-md border border-[var(--ms-border)] text-center mono leading-[3rem] text-[var(--ms-body)] opacity-60"
                  >
                    Add to Cart
                  </button>
                  <button type="button" disabled className="ms-button h-14 w-full mono opacity-60">
                    Buy Now
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={cartStatus !== "idle"}
                    onClick={() => addToCart("stay")}
                    className={`h-12 rounded-md border border-[var(--ms-border)] text-center mono leading-[3rem] disabled:cursor-not-allowed disabled:opacity-60 ${
                      isConfigComplete ? "hover:bg-[var(--ms-hover-bg)]" : "cursor-not-allowed opacity-60"
                    }`}
                  >
                    {cartStatus === "adding" ? "Adding..." : "Add to Cart"}
                  </button>
                  <button
                    type="button"
                    disabled={cartStatus !== "idle"}
                    onClick={() => addToCart("cart")}
                    className={`ms-button h-14 w-full mono disabled:cursor-not-allowed disabled:opacity-60 ${
                      isConfigComplete ? "" : "cursor-not-allowed opacity-60"
                    }`}
                  >
                    {cartStatus === "buying" ? "Opening Cart..." : "Buy Now"}
                  </button>
                </>
              )}
            </div>
            {cartMessage ? <p className="mt-4 text-center text-sm text-[var(--ms-gradient-end)]">{cartMessage}</p> : null}
          </div>
        </aside>
      </section>
      {showSiteChrome ? <SiteFooter /> : null}
      {requiredModal ? (
        <RequiredServicesModal
          services={requiredModal.items}
          currency={currency}
          submitting={cartStatus !== "idle"}
          onCancel={() => {
            if (cartStatus === "idle") setRequiredModal(null);
          }}
          onConfirm={handleRequiredConfirm}
        />
      ) : null}
    </main>
  );
}
