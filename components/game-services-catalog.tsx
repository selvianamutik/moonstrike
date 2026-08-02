"use client";

import { useMemo, useState, useEffect } from "react";
import { PlaceholderAsset } from "@/components/asset-image";
import { ScrollingTabList, type ScrollingTabItem } from "@/components/scrolling-tab-list";
import { ServiceCard } from "@/components/service-card";
import { useCurrency } from "@/hooks/useCurrency";
import type { GameCatalogItem, GameService } from "@/lib/catalog";

type ServiceTab = {
  href: string;
  label: string;
  slug: string;
  sortOrder: number;
};

const initialVisibleCount = 8;
const visibleIncrement = 8;

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
  const [visible, setVisible] = useState(initialVisibleCount);
  const [discordUrl, setDiscordUrl] = useState<string | null>(null);
  const { currency } = useCurrency();
  const tabSourceServices = navigationServices ?? services;

  useEffect(() => {
    fetch('/api/public/social-links')
      .then((r) => r.json())
      .then((data) => {
        const discord = Array.isArray(data) ? data.find((link: any) => link.platform === 'discord') : null;
        setDiscordUrl(discord?.url || null);
      })
      .catch(() => {});
  }, []);

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
  const visibleServices = filteredServices.slice(0, visible);
  const heroImage = game.heroImage || game.image;
  const fixedTabs: ScrollingTabItem[] = [];
  const scrollingTabs: ScrollingTabItem[] = tabs.map((tab) => ({
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
          {/* <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--ms-body)]">{game.description}</p> */}
        </div>
      </div>

      <div className="relative mt-8 flex min-h-72 overflow-hidden rounded-md border border-[var(--ms-border)] bg-[var(--ms-bg-card)]">
        {heroImage ? (
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
        ) : (
          <PlaceholderAsset
            isHidden={false}
            alt={`${game.name} boosting service banner`}
            className="absolute inset-0"
            imageClassName="p-16"
            priority
          />
        )}
        <div className="absolute inset-0 " style={{ background: "var(--ms-hero-gradient)" }} />
        <div className="absolute inset-0 " style={{ background: "var(--ms-hero-gradient)" }} />

        <div className="relative z-10 flex w-full flex-col items-start justify-between gap-8 px-8 py-10 md:flex-row md:items-center md:px-16">
          <div className="max-w-xl">
            <p className="mono w-fit p-1 px-3 font-bold text-xs rounded-full uppercase tracking-[0.24em] text-[var(--ms-gradient-end)] bg-[var(--ms-gradient-start)]/20 text-[var(--ms-gradient-end)]">Selected game</p>
            <h2 className="font-display mt-4 text-3xl font-black tracking-[-0.04em] md:text-4xl">
              {game.name} Boost Catalog
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-[var(--ms-body)]">
              Browse active offers, compare service categories, and pick the run that matches your current goal.
            </p>
          </div>

          {/* Discord Join Us */}
          {discordUrl && (
            <a
              href={discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full shrink-0 items-center gap-3 rounded-xl border border-white/20 bg-[#5865F2]/20 px-5 py-4 text-white backdrop-blur-sm transition-all hover:bg-[#5865F2]/40 hover:border-white/30 sm:w-auto"
            >
            <svg width="28" height="22" viewBox="0 0 28 22" fill="none" aria-hidden="true">
              <path d="M23.7187 1.84C21.9252 1.0175 20.0095 0.418768 18.0185 0.0800018C17.7765 0.512502 17.4944 1.0925 17.2986 1.556C15.1819 1.2425 13.0852 1.2425 11.0085 1.556C10.8127 1.0925 10.524 0.512502 10.2799 0.0800018C8.28694 0.418768 6.36923 1.02 4.5757 1.8445C0.658192 7.693 -0.40318 13.3985 0.127286 19.025C2.52479 20.7685 4.84548 21.8285 7.12736 22.5C7.69152 21.736 8.19548 20.921 8.62902 20.059C7.7989 19.7585 7.00298 19.384 6.24957 18.9435C6.44507 18.8035 6.63649 18.657 6.82173 18.506C11.8594 20.8385 17.3386 20.8385 22.3183 18.506C22.5055 18.657 22.6969 18.8035 22.8904 18.9435C22.135 19.386 21.3371 19.7605 20.507 20.061C20.9405 20.9225 21.4425 21.739 22.0087 22.5C24.2925 21.8285 26.6152 20.7685 29.0127 19.025C29.6267 12.5305 27.9474 6.877 23.7187 1.84ZM9.72844 15.574C8.2284 15.574 6.99319 14.2235 6.99319 12.574C6.99319 10.9245 8.20223 9.5715 9.72844 9.5715C11.2547 9.5715 12.4899 10.9245 12.4637 12.574C12.4657 14.2235 11.2547 15.574 9.72844 15.574ZM19.4315 15.574C17.9315 15.574 16.6963 14.2235 16.6963 12.574C16.6963 10.9245 17.9053 9.5715 19.4315 9.5715C20.9578 9.5715 22.193 10.9245 22.1668 12.574C22.1668 14.2235 20.9578 15.574 19.4315 15.574Z" fill="white"/>
            </svg>
            <div className="text-left">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">Community</p>
              <p className="text-sm font-black text-white">Join our Discord</p>
            </div>
          </a>
          )}
        </div>
      </div>

      <div className="mt-8">
        <ScrollingTabList
          activeKey={activeSlug}
          ariaLabel={`${game.name} service categories`}
          fixedTabs={fixedTabs}
          scrollingTabs={scrollingTabs}
        />
      </div>

      <div className="mt-6 flex flex-col justify-between gap-3 text-sm text-[var(--ms-body)] md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <p>
            Showing <span className="mono text-[var(--ms-heading)]">{visibleServices.length}</span> services in{" "}
            <span className="text-[var(--ms-gradient-end)]">{activeLabel}</span>
          </p>
          {query ? (
            <button type="button" onClick={() => setQuery("")} className="w-fit text-[var(--ms-gradient-end)] hover:underline">
              Clear search
            </button>
          ) : null}
        </div>
        <div className="flex h-12 w-full items-center rounded-md border border-[var(--ms-border)] bg-[var(--ms-bg-card)] px-4 text-[var(--ms-body)] md:w-96">
          <label htmlFor="game-services-search" className="sr-only">
            Search services
          </label>
          <input
            id="game-services-search"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisible(initialVisibleCount);
            }}
            placeholder={`Search ${game.name} services...`}
            className="w-full bg-transparent mono text-sm outline-none"
          />
        </div>
      </div>

      {filteredServices.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {visibleServices.map((service) => (
            <ServiceCard key={service.slug} service={service} />
          ))}
        </div>
      ) : (
        <div className="ms-card mt-8 rounded-xl p-10 text-center">
          <h2 className="text-2xl font-black">No services found</h2>
          <p className="mt-3 text-[var(--ms-body)]">Try another search term or switch category.</p>
        </div>
      )}
      {visible < filteredServices.length ? (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((current) => current + visibleIncrement)}
            className="ms-button h-12 px-8 mono text-sm uppercase tracking-[0.18em]"
          >
            Load More
          </button>
        </div>
      ) : null}
    </>
  );
}
