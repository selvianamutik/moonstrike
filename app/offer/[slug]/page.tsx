import { notFound } from "next/navigation";
import { getPrivateOfferBySlug } from "@/lib/admin/private-offers";
import { listAdminGames } from "@/lib/cms/games";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { OfferPageClient } from "./OfferPageClient";

export default async function OfferPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const offer = await getPrivateOfferBySlug(slug);
  if (!offer || offer.status !== "active") notFound();

  const [games] = await Promise.all([listAdminGames()]);
  const game = games.find((g) => g.id === offer.game_id);

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />
      <OfferPageClient offer={offer} gameName={game?.name ?? "Game"} gameImage={game?.image ?? ""} />
      <SiteFooter />
    </main>
  );
}
