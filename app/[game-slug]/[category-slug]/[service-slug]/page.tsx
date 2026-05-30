import { notFound } from "next/navigation";
import { ServiceDetail } from "@/components/service-detail";
import { getActiveGameBySlug, getServiceForGame } from "@/lib/cms/game-services";

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

  return <ServiceDetail service={service} />;
}
