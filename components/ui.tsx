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

export function RegionSelector({
  active = "USA",
  availableRegions = ["USA", "EUROPE"],
  onChange,
}: {
  active?: "USA" | "EUROPE";
  availableRegions?: Array<"USA" | "EUROPE">;
  onChange?: (region: "USA" | "EUROPE") => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-1">
      {(["USA", "EUROPE"] as const).map((region) => (
        <button
          key={region}
          type="button"
          disabled={!availableRegions.includes(region)}
          onClick={() => onChange?.(region)}
          className={`h-9 rounded-full px-4 mono text-xs font-bold uppercase tracking-[0.18em] ${
            active === region
              ? "bg-[var(--primary)] text-[var(--ms-heading)] shadow-[0_0_18px_rgba(139,92,246,0.35)]"
              : "text-[var(--ms-body)] hover:text-[var(--ms-heading)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-[var(--ms-body)]"
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
  href?: string;
  image?: string;
  name: string;
  platform?: string;
};

export function GameCard({ description, genre, href, image, name, platform = "Cross-play" }: GameCardProps) {
  const content = (
    <article className="ms-card ms-card-hover flex h-full flex-col overflow-hidden rounded-lg">
      {image ? (
        <div className="relative h-52 overflow-hidden bg-[var(--ms-bg-card)]">
          <img src={image} alt={`${name} preview`} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/35" />
        </div>
      ) : (
        <PlaceholderAsset  isHidden={false} alt={`${name} preview`} className="h-52" />
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex min-h-8 flex-wrap content-start gap-2">
          <Badge>{genre}</Badge>
          <Badge variant="soon">{platform}</Badge>
        </div>
        <h3 className="font-display mt-4 line-clamp-2 min-h-16 text-2xl font-black tracking-[-0.03em] text-[var(--ms-heading)]">{name}</h3>
        <p className="mt-2 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-[var(--ms-body)]">{description}</p>
      </div>
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ms-gradient-end)]">
        {content}
      </Link>
    );
  }

  return content;
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
        <Link
          key={`${service.gameSlug}-${service.slug}`}
          href={getServiceDetailHref(service)}
          className="ms-card ms-card-hover rounded-lg p-3"
        >
          <PlaceholderAsset isHidden={false} alt={`${service.name} search result`} className="h-28 rounded-md" imageClassName="p-4" />
          <h3 className="mt-3 font-bold text-[var(--ms-heading)]">{service.name}</h3>
        </Link>
      ))}
    </div>
  );
}
