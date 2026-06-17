import Link from "next/link";
import { Frame18Sections } from "@/components/frame-18-sections";
import { HeroCarousel } from "@/components/hero-carousel";
import { LandingGamesSection } from "@/components/landing-games-section";
import { ServiceCard } from "@/components/service-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { gameServices, trustMetrics } from "@/lib/catalog";
import { listActiveCatalogGames } from "@/lib/cms/games";
import { listActiveServices, getActiveLandingCms, getActiveHeroSlides } from "@/lib/cms/landing";

export default async function Home() {
  const [{ benefits }, heroes, gameCards] = await Promise.all([
    getActiveLandingCms(),
    getActiveHeroSlides(),
    listActiveCatalogGames(),
    listActiveServices(),
  ]);
  const hotOffers = activeServices
    .filter((service) => service.is_hot_offer)
    .sort((a, b) => {
      const aTime = a.hot_offer_at ? new Date(a.hot_offer_at).getTime() : 0;
      const bTime = b.hot_offer_at ? new Date(b.hot_offer_at).getTime() : 0;

      return bTime - aTime || a.title.localeCompare(b.title);
    });
  const bestOffers = (hotOffers.length > 0 ? hotOffers : activeServices).slice(0, 4).map(serviceRowToCatalogService);

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />

      <section className="ms-shell py-20">
        <p className="mono text-sm font-black uppercase tracking-[0.2em] text-[var(--ms-body)]">
          {heroes[0]?.label || "Featured Recommended"}
        </p>
        <div className="relative mt-6">
          <HeroCarousel heroes={heroes} />
        </div>
      </section>

      <section className="ms-shell py-10">
        <div className="flex items-end justify-between gap-6">
          <h2 className="font-display text-3xl font-black tracking-[-0.04em]">
            Hot <span className="section-accent">Offers</span>
          </h2>
          <Link href="/games" className="mono text-sm uppercase tracking-[0.3em] text-[var(--ms-gradient-end)]">
            View all deals
          </Link>
        </div>
        {bestOffers.length > 0 ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {bestOffers.map((service) => (
              <ServiceCard key={`${service.gameSlug}-${service.slug}`} service={service} />
            ))}
          </div>
        ) : (
          <div className="ms-card mt-10 rounded-xl p-10 text-center">
            <h3 className="text-2xl font-black">No active offers yet</h3>
            <p className="mt-3 text-[var(--ms-body)]">Publish services from admin to feature them here.</p>
          </div>
        )}
      </section>

      <LandingGamesSection games={gameCards} />

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
