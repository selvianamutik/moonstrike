import Link from "next/link";
import { PlaceholderAsset } from "@/components/asset-image";
import { Frame18Sections } from "@/components/frame-18-sections";
import { ServiceCard } from "@/components/service-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge, CategoryTabs, GameCard } from "@/components/ui";
import { gameServices, trustMetrics } from "@/lib/catalog";
import { getActiveLandingCms } from "@/lib/cms/landing";

const categoryTabs = [
  { label: "All Games", href: "/games" },
  { label: "Action RPG", href: "/games" },
  { label: "Tactical Shooting", href: "/games" },
  { label: "Looter Shooting", href: "/games" },
];

const gameCards = [
  {
    name: "Diablo IV",
    genre: "Action RPG",
    platform: "Cross-play",
    description: "Power level to max tier, farm legendary items, and clear seasonal content.",
  },
  {
    name: "World of Warcraft",
    genre: "MMORPG",
    platform: "PC",
    description: "Mythic dungeons, raids, vault rewards, and weekly character progression.",
  },
  {
    name: "Valorant",
    genre: "Tactical Shooter",
    platform: "PC",
    description: "Placement games, rank climbs, coaching, and duo queue support.",
  },
  {
    name: "Destiny 2",
    genre: "Looter Shooter",
    platform: "Cross-play",
    description: "Raid clears, exotic farms, trials support, and weekly pinnacle runs.",
  },
];

export default async function Home() {
  const { hero, benefits } = await getActiveLandingCms();

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />

      <section className="ms-shell py-20">
        <p className="mono text-sm font-black uppercase tracking-[0.2em] text-[var(--ms-body)]">
          {hero.label}
        </p>
        <div className="relative mt-6">
          <div className="grid overflow-hidden rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] lg:grid-cols-[1fr_280px]">
            <PlaceholderAsset alt="Void Descent seasonal event" className="min-h-[450px]" priority imageClassName="p-20">
              {hero.imageUrl && (
                <img src={hero.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
              )}
              <div className="absolute bottom-8 left-8 max-w-xl">
                <Badge variant={hero.badgeVariant} />
                <h1 className="font-display mt-5 text-4xl font-black tracking-[-0.04em] sm:text-6xl">
                  {hero.headline}
                </h1>
                <p className="mt-4 max-w-lg text-lg leading-8 text-[var(--ms-body)]">
                  {hero.subtext}
                </p>
                <Link href={hero.ctaHref} className="ms-button mt-6 h-11 px-6">
                  {hero.ctaText}
                </Link>
              </div>
            </PlaceholderAsset>
            <aside className="border-l border-[var(--ms-border)] p-5">
              <p className="mono text-sm uppercase tracking-[0.18em] text-[var(--ms-body)]">Coming Soon</p>
              {["Elite Trials Return", "Mythic+ Cache Update", "Ranked Climb Events"].map((item) => (
                <div key={item} className="mt-5 flex gap-4">
                  <PlaceholderAsset alt={`${item} preview`} className="h-12 w-20 rounded" imageClassName="p-3" />
                  <p className="text-sm leading-4">
                    <Badge variant="featured" />
                    <span className="mt-2 block text-[var(--ms-body)]">{item}</span>
                  </p>
                </div>
              ))}
            </aside>
          </div>
        </div>
      </section>

      <section className="ms-shell py-10">
        <div className="flex items-end justify-between gap-6">
          <h2 className="font-display text-3xl font-black tracking-[-0.04em]">
            Best <span className="section-accent">Offers</span>
          </h2>
          <Link href="/games" className="mono text-sm uppercase tracking-[0.3em] text-[var(--ms-gradient-end)]">
            View all deals
          </Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {gameServices.slice(0, 4).map((service) => (
            <ServiceCard key={service.slug} service={service} />
          ))}
        </div>
      </section>

      <section className="ms-shell py-14">
        <div className="flex items-end justify-between gap-6">
          <h2 className="font-display text-3xl font-black tracking-[-0.04em]">
            All <span className="section-accent">Games</span>
          </h2>
          <Link href="/games" className="mono text-sm uppercase tracking-[0.3em] text-[var(--ms-gradient-end)]">
            View all
          </Link>
        </div>
        <div className="mt-10">
          <CategoryTabs items={categoryTabs} />
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {gameCards.map((game) => (
            <GameCard key={game.name} {...game} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/games" className="inline-flex rounded-md bg-[var(--ms-bg-card)] px-8 py-4 font-bold">
            Load More Games
          </Link>
        </div>
      </section>

      <section className="mt-10 border-y border-[var(--ms-border)] bg-[var(--ms-bg-card)] py-8">
        <div className="ms-shell grid grid-cols-2 gap-6 text-center md:grid-cols-4">
          {trustMetrics.concat({ value: "Top 1%", label: "Pro players" }).map((metric) => (
            <div key={metric.label}>
              <p className="mono text-2xl font-bold text-[var(--ms-heading)]">{metric.value}</p>
              <p className="mono mt-2 text-xs uppercase tracking-[0.28em] text-[var(--ms-body)]">{metric.label}</p>
            </div>
          ))}
        </div>
      </section>

      <Frame18Sections benefits={benefits} />

      <SiteFooter />
    </main>
  );
}
