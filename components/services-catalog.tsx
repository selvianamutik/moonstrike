import Link from "next/link";
import { PlaceholderAsset } from "@/components/asset-image";
import { ScrollingTabList, type ScrollingTabItem } from "@/components/scrolling-tab-list";
import { ServiceCard } from "@/components/service-card";
import type { GameService } from "@/lib/catalog";

type ServiceTab = {
  label: string;
  value: string;
  sortOrder: number;
};

function matchesCategory(service: GameService, category: string) {
  if (category === "all") return true;
  if (category === "hot") return service.isHotOffer;

  return (service.serviceCategorySlug ?? service.serviceCategory.toLowerCase()) === category;
}

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

function servicesHref(category: string, query: string) {
  const params = new URLSearchParams({ category });

  if (query.trim()) {
    params.set("q", query.trim());
  }

  return `/services?${params.toString()}`;
}

function getServiceTabs(services: GameService[]): ServiceTab[] {
  const categoryTabs = new Map<string, ServiceTab>();

  services.forEach((service) => {
    const value = service.serviceCategorySlug ?? service.serviceCategory.toLowerCase();

    if (!categoryTabs.has(value)) {
      categoryTabs.set(value, {
        label: service.serviceCategory,
        value,
        sortOrder: service.serviceCategorySortOrder ?? 999,
      });
    }
  });

  return [
    { label: "All Services", value: "all", sortOrder: -2 },
    { label: "Hot Offers", value: "hot", sortOrder: -1 },
    ...Array.from(categoryTabs.values()).sort(
      (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label),
    ),
  ];
}

export function ServicesCatalog({
  activeCategory,
  query,
  services,
}: {
  activeCategory: string;
  query: string;
  services: GameService[];
}) {
  const serviceTabs = getServiceTabs(services);
  const filteredServices = services.filter(
    (service) => matchesCategory(service, activeCategory) && matchesQuery(service, query),
  );
  const activeLabel = serviceTabs.find((tab) => tab.value === activeCategory)?.label ?? "Services";
  const fixedTabs: ScrollingTabItem[] = [];
  const scrollingTabs: ScrollingTabItem[] = serviceTabs.map((tab) => ({
    href: servicesHref(tab.value, query),
    key: tab.value,
    label: tab.label,
  }));

  return (
    <>
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mono text-xs uppercase tracking-[0.24em] text-[var(--ms-gradient-end)]">Service catalog</p>
          <h1 className="font-display mt-3 text-3xl font-black tracking-[-0.04em]">All Services</h1>
        </div>
        <form
          action="/services"
          className="flex h-12 w-full items-center rounded-md border border-[var(--ms-border)] bg-[var(--ms-bg-card)] px-4 text-[var(--ms-body)] md:w-96"
        >
          <input type="hidden" name="category" value={activeCategory} />
          <label htmlFor="services-search" className="sr-only">
            Search services
          </label>
          <input
            id="services-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search games, services..."
            className="w-full bg-transparent mono text-sm outline-none"
          />
        </form>
      </div>

      <PlaceholderAsset
        isHidden={false}
        alt="Featured boosting service banner"
        className="mt-8 flex min-h-72 flex-col items-start justify-between gap-8 rounded-md px-8 py-10 md:flex-row md:items-center md:px-16"
        priority
        imageClassName="p-16"
      >
        <div className="relative z-10 max-w-xl">
          <p className="mono text-xs uppercase tracking-[0.24em] text-[var(--ms-gradient-end)]">Featured game</p>
          <h2 className="font-display mt-4 text-3xl font-black tracking-[-0.04em] md:text-4xl">
            Seasonal Boost Catalog
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-[var(--ms-body)]">
            Browse hot offers, dungeon runs, powerleveling, raids, and story clears in your preferred currency.
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
          activeKey={activeCategory}
          ariaLabel="service categories"
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
          <Link href={`/services?category=${activeCategory}`} className="w-fit text-[var(--ms-gradient-end)] hover:underline">
            Clear search
          </Link>
        ) : null}
      </div>

      {filteredServices.length > 0 ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {filteredServices.map((service) => (
            <ServiceCard key={`${service.gameSlug}-${service.slug}`} service={service} />
          ))}
        </div>
      ) : (
        <div className="ms-card mt-8 rounded-xl p-10 text-center">
          <h2 className="text-2xl font-black">No services found</h2>
          <p className="mt-3 text-[var(--ms-body)]">
            Try a different search term or switch to another service category.
          </p>
        </div>
      )}
    </>
  );
}
