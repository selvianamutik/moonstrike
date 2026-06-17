"use client";

import Link from "next/link";
import { PlaceholderAsset } from "@/components/asset-image";
import { Badge } from "@/components/ui";
import { useCurrency } from "@/hooks/useCurrency";
import { getServiceDetailHref, type GameService } from "@/lib/catalog";

function formatMoney(value: number, currency: "USD" | "EUR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function ServiceCard({ service }: { service: GameService }) {
  const { currency } = useCurrency();
  const href = getServiceDetailHref(service);
  const price = currency === "EUR" ? service.startingPriceEUR ?? service.startingPrice : service.startingPrice;

  return (
    <Link href={href} className="group block h-full rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ms-gradient-end)]">
      <article className="ms-card ms-card-hover h-full overflow-hidden rounded-lg">
        <div className="relative h-48 overflow-hidden bg-[var(--ms-bg-card)]">
          {service.image ? (
            <>
              <img src={service.image} alt={`${service.name} preview`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/35" />
            </>
          ) : (
            <PlaceholderAsset alt={`${service.name} preview`} className="h-full" isHidden={false}/>
          )}
          {service.isHotOffer ? <span className="absolute left-3 top-3"><Badge variant="hot" /></span> : null}
        </div>
        <div className="flex h-[calc(100%-12rem)] flex-col p-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="featured">{service.serviceCategory}</Badge>
          </div>
          <h3 className="mt-4 text-lg font-bold text-[var(--ms-heading)] group-hover:text-[var(--ms-gradient-end)]">
            {service.offerTitle ?? service.name}
          </h3>
          <p className="mt-3 min-h-12 text-sm leading-6 text-[var(--ms-body)]">{service.description}</p>
          <div className="mt-auto flex items-center justify-between gap-3 pt-6">
            <span className="mono text-base font-bold text-[var(--ms-price)]">{formatMoney(price, currency)}</span>
            <span className="ms-button inline-flex h-10 items-center px-5 mono text-sm">
              Buy Now
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
