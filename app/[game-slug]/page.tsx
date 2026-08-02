import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameServicesCatalog } from "@/components/game-services-catalog";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getActiveGameBySlug, getServicesForGame, serviceRowsToCatalogServices } from "@/lib/cms/game-services";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://moonstrike.pro';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ "game-slug": string }>;
}): Promise<Metadata> {
  const { "game-slug": gameSlug } = await params;
  const game = await getActiveGameBySlug(gameSlug);
  if (!game) return {};

  const title = `${game.name} Boosting & Services`;
  const description = `Order ${game.name} boosting, coaching, and progression services on Moon Strike. Fast delivery, verified boosters.`;
  const url = `${BASE_URL}/${gameSlug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: game.image ? [{ url: game.image, alt: game.name }] : undefined,
    },
    twitter: {
      title,
      description,
      images: game.image ? [game.image] : undefined,
    },
  };
}

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
