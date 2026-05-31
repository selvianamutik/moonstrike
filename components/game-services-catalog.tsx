"use client";

import { useMemo, useState } from "react";
import { PlaceholderAsset } from "@/components/asset-image";
import { ScrollingTabList, type ScrollingTabItem } from "@/components/scrolling-tab-list";
import { ServiceCard } from "@/components/service-card";
import type { GameCatalogItem, GameService } from "@/lib/catalog";

type ServiceTab = {
  href: string;
  label: string;
  slug: string;
  sortOrder: number;
};

function matchesQuery(service: GameService, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) return true;

  return [
    service.name,
    service.offerTitle,
    service.gameName,
    service.serviceCategory,
    service.description,
    ...service.tags,
  ].some((value) => (value ?? "").toLowerCase().includes(normalizedQuery));
}

export function GameServicesCatalog({
  activeSlug,
  game,
  navigationServices,
  services,
}: {
  activeSlug: string;
  game: GameCatalogItem;
  navigationServices?: GameService[];
  services: GameService[];
}) {
  const [query, setQuery] = useState("");
  const tabSourceServices = navigationServices ?? services;
  const tabs = useMemo<ServiceTab[]>(() => {
    const categoryTabs = new Map<string, ServiceTab>();

    tabSourceServices.forEach((service) => {
      const slug = service.serviceCategorySlug ?? service.serviceCategory.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

      if (!categoryTabs.has(slug)) {
        categoryTabs.set(slug, {
          href: `/${game.slug}/${slug}`,
          label: service.serviceCategory,
          slug,
          sortOrder: service.serviceCategorySortOrder ?? 999,
        });
      }
    });

    return [
      { href: `/${game.slug}`, label: "All", slug: "all", sortOrder: -2 },
      { href: `/${game.slug}/hot-offers`, label: "Hot Offers", slug: "hot-offers", sortOrder: -1 },
      ...Array.from(categoryTabs.values()).sort(
        (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label),
      ),
    ];
  }, [game.slug, tabSourceServices]);

  const activeLabel = tabs.find((tab) => tab.slug === activeSlug)?.label ?? "All";
  const filteredServices = services.filter((service) => matchesQuery(service, query));
  const fixedTabs: ScrollingTabItem[] = tabs.slice(0, 2).map((tab) => ({
    href: tab.href,
    key: tab.slug,
    label: tab.label,
  }));
  const scrollingTabs: ScrollingTabItem[] = tabs.slice(2).map((tab) => ({
    href: tab.href,
    key: tab.slug,
    label: tab.label,
  }));

  return (
    <>
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mono text-xs uppercase tracking-[0.24em] text-[var(--ms-gradient-end)]">{game.genre}</p>
          <h1 className="font-display mt-3 text-3xl font-black tracking-[-0.04em]">{game.name} Services</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--ms-body)]">{game.description}</p>
        </div>
        <div className="flex h-12 w-full items-center rounded-md border border-[var(--ms-border)] bg-[var(--ms-bg-card)] px-4 text-[var(--ms-body)] md:w-96">
          <label htmlFor="game-services-search" className="sr-only">
            Search services
          </label>
          <input
            id="game-services-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${game.name} services...`}
            className="w-full bg-transparent mono text-sm outline-none"
          />
        </div>
      </div>

      <PlaceholderAsset
        alt={`${game.name} boosting service banner`}
        className="mt-8 flex min-h-72 flex-col items-start justify-between gap-8 rounded-md px-8 py-10 md:flex-row md:items-center md:px-16"
        imageClassName="p-16"
        priority
      >
        <div className="relative z-10 max-w-xl">
          <p className="mono text-xs uppercase tracking-[0.24em] text-[var(--ms-gradient-end)]">Selected game</p>
          <h2 className="font-display mt-4 text-3xl font-black tracking-[-0.04em] md:text-4xl">
            {game.name} Boost Catalog
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-[var(--ms-body)]">
            Browse active offers, compare service categories, and pick the run that matches your current goal.
          </p>
        </div>
        <div className="relative z-10 text-left md:text-center">
          <div className="inline-flex rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-1">
            <span className="h-9 rounded-full bg-[var(--primary)] px-4 mono text-xs font-bold uppercase leading-9 tracking-[0.18em] text-[var(--ms-heading)] shadow-[0_0_18px_rgba(139,92,246,0.35)]">
              USD
            </span>
            <span className="h-9 rounded-full px-4 mono text-xs font-bold uppercase leading-9 tracking-[0.18em] text-[var(--ms-body)]">
              EUR
            </span>
          </div>
          <p className="mt-3 text-sm text-[var(--ms-gradient-end)]">USD / EUR pricing view</p>
        </div>
      </PlaceholderAsset>

      <div className="mt-8">
        <ScrollingTabList
          activeKey={activeSlug}
          ariaLabel={`${game.name} service categories`}
          fixedTabs={fixedTabs}
          scrollingTabs={scrollingTabs}
        />
      </div>

      <div className="mt-6 flex flex-col justify-between gap-3 text-sm text-[var(--ms-body)] md:flex-row md:items-center">
        <p>
          Showing <span className="mono text-[var(--ms-heading)]">{filteredServices.length}</span> services in{" "}
          <span className="text-[var(--ms-gradient-end)]">{activeLabel}</span>
        </p>
        {query ? (
          <button type="button" onClick={() => setQuery("")} className="w-fit text-[var(--ms-gradient-end)] hover:underline">
            Clear search
          </button>
        ) : null}
      </div>

      {filteredServices.length > 0 ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {filteredServices.map((service) => (
            <ServiceCard key={service.slug} service={service} />
          ))}
        </div>
      ) : (
        <div className="ms-card mt-8 rounded-xl p-10 text-center">
          <h2 className="text-2xl font-black">No services found</h2>
          <p className="mt-3 text-[var(--ms-body)]">Try another search term or switch category.</p>
        </div>
      )}
    </>
  );
}
