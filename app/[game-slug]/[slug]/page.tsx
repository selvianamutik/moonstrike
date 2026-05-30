import { notFound } from "next/navigation";
import { GameServicesCatalog } from "@/components/game-services-catalog";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  getActiveGameBySlug,
  getCategoryServicesForGame,
  getHotServicesForGame,
  getServicesForGame,
  getServiceForGame,
} from "@/lib/cms/game-services";

export default async function GameSlugPage({
  params,
}: {
  params: Promise<{ "game-slug": string; slug: string }>;
}) {
  const { "game-slug": gameSlug, slug } = await params;
  const game = await getActiveGameBySlug(gameSlug);

  if (!game) notFound();

  const gameServices = getServicesForGame(game);

  if (slug === "hot-offers") {
    return (
      <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
        <SiteHeader />
        <section className="ms-shell py-16">
          <GameServicesCatalog
            activeSlug="hot-offers"
            game={game}
            navigationServices={gameServices}
            services={getHotServicesForGame(game)}
          />
        </section>
        <SiteFooter />
      </main>
    );
  }

  const categoryServices = getCategoryServicesForGame(game, slug);

  if (categoryServices.length > 0) {
    return (
      <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
        <SiteHeader />
        <section className="ms-shell py-16">
          <GameServicesCatalog
            activeSlug={slug}
            game={game}
            navigationServices={gameServices}
            services={categoryServices}
          />
        </section>
        <SiteFooter />
      </main>
    );
  }

  const service = getServiceForGame(game, slug);

  if (service) {
    return (
      <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
        <SiteHeader />
        <section className="ms-shell py-20">
          <h1 className="font-display text-4xl font-black tracking-[-0.04em]">{service.name}</h1>
          <p className="mt-4 max-w-3xl text-[var(--ms-body)]">{service.description}</p>
        </section>
        <SiteFooter />
      </main>
    );
  }

  notFound();
}
