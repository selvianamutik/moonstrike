"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PlaceholderAsset } from "@/components/asset-image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui";
import { useCurrency, type Currency } from "@/hooks/useCurrency";
import type { ServiceOption, ServiceRow } from "@/lib/cms/services";

function optionLabel(option: ServiceOption) {
  if (option.type === "dropdown") return "Dropdown";
  if (option.type === "radio" || option.type === "single_choice") return "Single Choice";
  if (option.type === "checkbox_group" || option.type === "multiple_choice") return "Multiple Choice";
  if (option.type === "range") return "Range";
  if (option.type === "number_stepper" || option.type === "scalar") return "Stepper";
  if (option.type === "quantity") return "Quantity";
  if (option.type === "toggle") return "Toggle";
  if (option.type === "textarea") return "Long Text";
  if (option.type === "text") return "Text";
  return "Quantity";
}

type SelectionValue = string | string[] | number | boolean;

function isMultiChoice(option: ServiceOption) {
  return option.type === "multiple_choice" || option.type === "checkbox_group";
}

function isChoice(option: ServiceOption) {
  return option.type === "single_choice" || option.type === "multiple_choice" || option.type === "dropdown" || option.type === "radio" || option.type === "checkbox_group";
}

function isQuantity(option: ServiceOption) {
  return option.type === "scalar" || option.type === "range" || option.type === "number_stepper";
}

function isQuantityOption(option: ServiceOption) {
  return option.type === "quantity";
}

function getDefaultSelection(option: ServiceOption): SelectionValue {
  if (isMultiChoice(option)) return [];
  if (isQuantityOption(option)) return option.min ?? 1;
  if (isQuantity(option)) return option.min ?? 1;
  if (option.type === "toggle") return false;
  if (option.type === "text" || option.type === "textarea") return "";
  return option.options?.[0]?.label ?? "";
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

  if (isQuantity(option)) {
    const unitPrice = currency === "EUR" ? option.pricePerUnitEUR ?? 0 : option.pricePerUnitUSD ?? 0;
    return (Number(value) || 0) * unitPrice;
  }

  if (isMultiChoice(option)) {
    const selected = Array.isArray(value) ? value : [];
    return (option.options ?? [])
      .filter((item) => selected.includes(item.label))
      .reduce((total, item) => total + (currency === "EUR" ? item.priceEUR : item.priceUSD), 0);
  }

  if (option.type === "toggle") {
    return value === true ? (currency === "EUR" ? option.priceEUR ?? 0 : option.priceUSD ?? 0) : 0;
  }

  if (!isChoice(option)) return 0;

  const selected = option.options?.find((item) => item.label === value);
  return selected ? (currency === "EUR" ? selected.priceEUR : selected.priceUSD) : 0;
}

function optionPrice(option: ServiceOption, currency: Currency) {
  return currency === "EUR" ? option.priceEUR ?? 0 : option.priceUSD ?? 0;
}

function choicePrice(item: { priceUSD: number; priceEUR: number }, currency: Currency) {
  return currency === "EUR" ? item.priceEUR : item.priceUSD;
}

function ServiceOptions({
  options,
  selections,
  currency,
  onChange,
}: {
  options: ServiceOption[];
  selections: Record<string, SelectionValue>;
  currency: Currency;
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
        <div key={`${option.label}-${index}`} className="rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-5">
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
              <div className="mt-2 flex items-center justify-between text-xs text-[var(--ms-body)]">
                <span>
                  {Number(selections[option.label] ?? getDefaultSelection(option))}
                </span>
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
                <span className="mono min-w-16 text-center text-sm text-[var(--ms-heading)]">
                  {Number(selections[option.label] ?? getDefaultSelection(option))}
                </span>
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
              className="mt-4 h-12 w-full rounded-md border border-[var(--ms-border)] bg-[var(--ms-bg-page)] px-4 text-sm outline-none focus:border-[var(--ms-gradient-end)]"
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
  const [selections, setSelections] = useState<Record<string, SelectionValue>>(() =>
    Object.fromEntries(service.options_schema.map((option) => [option.label, getDefaultSelection(option)]))
  );
  const quantityOption = service.options_schema.find(isQuantityOption);
  const quantity = quantityOption ? Number(selections[quantityOption.label] ?? getDefaultSelection(quantityOption)) || 1 : 1;
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

  async function addToCart(nextAction: "stay" | "cart") {
    if (previewMode || cartStatus !== "idle") return;

    setCartMessage("");
    setCartStatus(nextAction === "cart" ? "buying" : "adding");

    try {
      const response = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: service.id, selectedOptions: selections }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setCartMessage(payload.error ?? "Unable to add this service to cart.");
        return;
      }

      window.dispatchEvent(new Event("moonstrike:cart-updated"));

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

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      {showSiteChrome ? <SiteHeader /> : null}
      {previewMode ? (
        <div className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-3 text-center text-sm font-medium text-amber-200">
          PREVIEW MODE - This service is not yet published.
        </div>
      ) : null}
      <section className="ms-shell grid gap-12 py-20 lg:grid-cols-[1fr_390px]">
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
            <div className="relative mt-12 h-[380px] overflow-hidden rounded-lg border border-[var(--ms-border)]">
              <img src={service.image} alt={`${service.title} preview`} className="h-full w-full object-cover" />
            </div>
          ) : (
            <PlaceholderAsset
              alt={`${service.title} service preview`}
              className="mt-12 h-[380px] rounded-lg border border-[var(--ms-border)]"
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
              <li key={item} className="flex items-center gap-3">
                <span className="text-[var(--ms-danger)]">-</span>
                {item}
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

        <aside className="ms-card h-fit rounded-xl p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] lg:sticky lg:top-32">
          <h2 className="text-lg font-medium">Configure Your Run</h2>
          <div className="mt-6 inline-flex rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-1">
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
          </div>
          <div className="mt-8">
            <ServiceOptions
              options={service.options_schema}
              selections={selections}
              currency={currency}
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
                    className="h-12 rounded-md border border-[var(--ms-border)] text-center mono leading-[3rem] hover:bg-[var(--ms-hover-bg)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {cartStatus === "adding" ? "Adding..." : "Add to Cart"}
                  </button>
                  <button
                    type="button"
                    disabled={cartStatus !== "idle"}
                    onClick={() => addToCart("cart")}
                    className="ms-button h-14 w-full mono disabled:cursor-not-allowed disabled:opacity-60"
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
    </main>
  );
}
