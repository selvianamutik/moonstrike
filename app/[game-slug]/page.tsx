import { notFound } from "next/navigation";
import { GameServicesCatalog } from "@/components/game-services-catalog";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getActiveGameBySlug, getServicesForGame, serviceRowsToCatalogServices } from "@/lib/cms/game-services";

export default async function GameServicesPage({ params }: { params: Promise<{ "game-slug": string }> }) {
  const { "game-slug": gameSlug } = await params;
  const game = await getActiveGameBySlug(gameSlug);

  if (!game) notFound();

  const services = await getServicesForGame(game);

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />
      <section className="ms-shell py-16">
        <GameServicesCatalog activeSlug="all" game={game} services={serviceRowsToCatalogServices(services)} />
      </section>
      <SiteFooter />
    </main>
  );
}
