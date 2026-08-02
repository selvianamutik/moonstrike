import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetail } from "@/components/service-detail";
import { getActiveGameBySlug, getServiceForGame } from "@/lib/cms/game-services";

import { JsonLd } from "@/components/JsonLd";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://moonstrike.pro';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ "game-slug": string; "category-slug": string; "service-slug": string }>;
}): Promise<Metadata> {
  const { "game-slug": gameSlug, "category-slug": categorySlug, "service-slug": serviceSlug } = await params;
  const game = await getActiveGameBySlug(gameSlug);
  if (!game) return {};

  const service = await getServiceForGame(game, serviceSlug);
  if (!service || service.service_category_slug !== categorySlug) return {};

  const title = `${service.title} — ${game.name}`;
  const description = service.description
    ? service.description.slice(0, 155)
    : `Order ${service.title} for ${game.name} on Moon Strike. Fast delivery, verified boosters.`;
  const url = `${BASE_URL}/${gameSlug}/${categorySlug}/${serviceSlug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: service.image ? [{ url: service.image, alt: service.title }] : undefined,
    },
    twitter: {
      title,
      description,
      images: service.image ? [service.image] : undefined,
    },
  };
}

export default async function GameServiceDetailPage({
  params,
}: {
  params: Promise<{ "game-slug": string; "category-slug": string; "service-slug": string }>;
}) {
  const { "game-slug": gameSlug, "category-slug": categorySlug, "service-slug": serviceSlug } = await params;
  const game = await getActiveGameBySlug(gameSlug);

  if (!game) notFound();

  const service = await getServiceForGame(game, serviceSlug);

  if (!service || service.service_category_slug !== categorySlug) {
    notFound();
  }

  return (
    <>
      <JsonLd
        type="service-page"
        serviceTitle={service.title}
        serviceDescription={service.description ?? undefined}
        serviceImage={service.image ?? undefined}
        gameName={game.name}
        gameSlug={gameSlug}
        categoryName={service.service_category_slug}
        breadcrumbs={[
          { name: game.name, href: `/${gameSlug}` },
          { name: service.service_category_slug, href: `/${gameSlug}/${categorySlug}` },
          { name: service.title, href: `/${gameSlug}/${categorySlug}/${serviceSlug}` },
        ]}
      />
      <ServiceDetail service={service} />
    </>
  );
}
