import Image from "next/image";
import Link from "next/link";
import { PlaceholderAsset } from "@/components/asset-image";
import { getServiceDetailHref } from "@/lib/catalog";

type BadgeVariant = "hot" | "new" | "soon" | "featured";

const badgeLabels: Record<BadgeVariant, string> = {
  hot: "HOT",
  new: "NEW UPDATE",
  soon: "COMING SOON",
  featured: "FEATURED",
};

const badgeClassNames: Record<BadgeVariant, string> = {
  hot: "bg-[var(--ms-danger)] text-white",
  new: "bg-[var(--ms-gradient-end)]/20 text-[var(--ms-gradient-end)]",
  soon: "bg-[var(--ms-hover-bg)] text-[var(--ms-body)]",
  featured: "bg-[var(--ms-gradient-start)]/20 text-[var(--ms-gradient-end)]",
};

export function Badge({ variant = "featured", children }: { variant?: BadgeVariant; children?: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 mono text-[10px] font-bold uppercase tracking-[0.18em] ${badgeClassNames[variant]}`}
    >
      {children ?? badgeLabels[variant]}
    </span>
  );
}

type CategoryTab = {
  label: string;
  href?: string;
};

export function CategoryTabs({ activeIndex = 0, items }: { activeIndex?: number; items: CategoryTab[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <button
        type="button"
        aria-label="Previous category"
        className="h-10 w-10 rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)] text-xl text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)]"
      >
        &lt;
      </button>
      {items.map((item, index) => {
        const className = `inline-flex items-center justify-center ${
          index === activeIndex
            ? "ms-button"
            : "border border-[var(--ms-border)] bg-[var(--ms-bg-card)] text-[var(--ms-heading)] hover:border-[var(--ms-gradient-end)] hover:bg-[var(--ms-hover-bg)]"
        } h-10 rounded-full px-5 mono text-xs uppercase tracking-[0.22em]`;

        if (item.href) {
          return (
            <Link key={item.label} href={item.href} className={className}>
              {item.label}
            </Link>
          );
        }

        return (
          <button key={item.label} type="button" className={className}>
            {item.label}
          </button>
        );
      })}
      <button
        type="button"
        aria-label="Next category"
        className="h-10 w-10 rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)] text-xl text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)]"
      >
        &gt;
      </button>
    </div>
  );
}

export function RegionSelector({ active = "USA" }: { active?: "USA" | "EUROPE" }) {
  return (
    <div className="inline-flex rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-1">
      {(["USA", "EUROPE"] as const).map((region) => (
        <button
          key={region}
          type="button"
          className={`h-9 rounded-full px-4 mono text-xs font-bold uppercase tracking-[0.18em] ${
            active === region
              ? "bg-[var(--primary)] text-[var(--ms-heading)] shadow-[0_0_18px_rgba(139,92,246,0.35)]"
              : "text-[var(--ms-body)] hover:text-[var(--ms-heading)]"
          }`}
        >
          {region}
        </button>
      ))}
    </div>
  );
}

type GameCardProps = {
  description: string;
  genre: string;
  name: string;
  platform?: string;
};

export function GameCard({ description, genre, name, platform = "Cross-play" }: GameCardProps) {
  return (
    <article className="ms-card ms-card-hover overflow-hidden rounded-lg">
      <PlaceholderAsset alt={`${name} preview`} className="h-52" />
      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          <Badge>{genre}</Badge>
          <Badge variant="soon">{platform}</Badge>
        </div>
        <h3 className="font-display mt-4 text-2xl font-black tracking-[-0.03em] text-[var(--ms-heading)]">{name}</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--ms-body)]">{description}</p>
      </div>
    </article>
  );
}

type StarRatingProps = {
  comment: string;
  username: string;
};

export function StarRating({ comment, username }: StarRatingProps) {
  return (
    <article className="ms-card ms-card-hover rounded-md p-5 text-left">
      <h3 className="mono text-base font-bold text-[var(--ms-heading)]">{username}</h3>
      <div className="mt-3 flex gap-1" aria-label="5 star rating">
        {Array.from({ length: 5 }, (_, index) => (
          <Image key={index} src="/assets/star.png" alt="" width={18} height={18} />
        ))}
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--ms-body)]">{comment}</p>
    </article>
  );
}

type SearchResultService = {
  gameSlug: string;
  name: string;
  slug: string;
};

export function SearchResults({ query, services }: { query: string; services: SearchResultService[] }) {
  if (services.length === 0) {
    return (
      <div className="ms-card rounded-lg p-6 text-center text-[var(--ms-body)]">
        No services found for {query}.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <Link key={service.slug} href={getServiceDetailHref(service)} className="ms-card ms-card-hover rounded-lg p-3">
          <PlaceholderAsset alt={`${service.name} search result`} className="h-28 rounded-md" imageClassName="p-4" />
          <h3 className="mt-3 font-bold text-[var(--ms-heading)]">{service.name}</h3>
        </Link>
      ))}
    </div>
  );
}
