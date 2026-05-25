import Link from "next/link";
import { PlaceholderAsset } from "@/components/asset-image";
import { ServiceCard } from "@/components/service-card";
import { RegionSelector } from "@/components/ui";
import type { GameService } from "@/lib/catalog";

export type ServiceCategoryFilter = "hot" | "dungeon" | "powerleveling" | "raid" | "stories";

type ServiceTab = {
  label: string;
  value: ServiceCategoryFilter;
};

const serviceTabs: ServiceTab[] = [
  { label: "Hot Offers", value: "hot" },
  { label: "Dungeons", value: "dungeon" },
  { label: "Powerleveling", value: "powerleveling" },
  { label: "Raid", value: "raid" },
  { label: "Stories", value: "stories" },
];

function matchesCategory(service: GameService, category: ServiceCategoryFilter) {
  if (category === "hot") return service.isHotOffer;

  return service.serviceCategory.toLowerCase() === category;
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

function servicesHref(category: ServiceCategoryFilter, query: string) {
  const params = new URLSearchParams({ category });

  if (query.trim()) {
    params.set("q", query.trim());
  }

  return `/services?${params.toString()}`;
}

export function ServicesCatalog({
  activeCategory,
  query,
  services,
}: {
  activeCategory: ServiceCategoryFilter;
  query: string;
  services: GameService[];
}) {
  const filteredServices = services.filter(
    (service) => matchesCategory(service, activeCategory) && matchesQuery(service, query),
  );
  const activeLabel = serviceTabs.find((tab) => tab.value === activeCategory)?.label ?? "Services";

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
            Browse hot offers, dungeon runs, powerleveling, raids, and story clears for your selected region.
          </p>
        </div>
        <div className="relative z-10 text-left md:text-center">
          <RegionSelector active="USA" />
          <p className="mt-3 text-sm text-[var(--ms-gradient-end)]">USA / Europe pricing view</p>
        </div>
      </PlaceholderAsset>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        {serviceTabs.map((tab) => (
          <Link
            key={tab.value}
            href={servicesHref(tab.value, query)}
            className={`inline-flex h-10 items-center justify-center rounded-full px-5 mono text-xs uppercase tracking-[0.22em] ${
              tab.value === activeCategory
                ? "ms-button"
                : "border border-[var(--ms-border)] bg-[var(--ms-bg-card)] text-[var(--ms-heading)] hover:border-[var(--ms-gradient-end)] hover:bg-[var(--ms-hover-bg)]"
            }`}
          >
            {tab.label}
          </Link>
        ))}
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
            <ServiceCard key={service.slug} service={service} />
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
