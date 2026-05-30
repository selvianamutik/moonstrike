import { notFound, redirect } from "next/navigation";
import { GameServicesCatalog } from "@/components/game-services-catalog";
import { ServiceDetail } from "@/components/service-detail";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  getActiveGameBySlug,
  getCategoryServicesForGame,
  getHotServicesForGame,
  getServicesForGame,
  getServiceForGame,
  serviceRowsToCatalogServices,
} from "@/lib/cms/game-services";

export default async function GameSlugPage({
  params,
}: {
  params: Promise<{ "game-slug": string; "category-slug": string }>;
}) {
  const { "game-slug": gameSlug, "category-slug": categorySlug } = await params;
  const game = await getActiveGameBySlug(gameSlug);

  if (!game) notFound();

  const gameServices = await getServicesForGame(game);
  const navigationServices = serviceRowsToCatalogServices(gameServices);

  if (categorySlug === "hot-offers") {
    const hotServices = await getHotServicesForGame(game);

    return (
      <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
        <SiteHeader />
        <section className="ms-shell py-16">
          <GameServicesCatalog
            activeSlug="hot-offers"
            game={game}
            navigationServices={navigationServices}
            services={serviceRowsToCatalogServices(hotServices)}
          />
        </section>
        <SiteFooter />
      </main>
    );
  }

  const categoryServices = await getCategoryServicesForGame(game, categorySlug);

  if (categoryServices.length > 0) {
    return (
      <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
        <SiteHeader />
        <section className="ms-shell py-16">
          <GameServicesCatalog
            activeSlug={categorySlug}
            game={game}
            navigationServices={navigationServices}
            services={serviceRowsToCatalogServices(categoryServices)}
          />
        </section>
        <SiteFooter />
      </main>
    );
  }

  const service = await getServiceForGame(game, categorySlug);

  if (service) {
    if (service.service_category_slug) {
      redirect(`/${game.slug}/${service.service_category_slug}/${service.slug}`);
    }

    return <ServiceDetail service={service} />;
  }

  notFound();
}
