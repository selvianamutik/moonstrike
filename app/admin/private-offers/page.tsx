import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { listPrivateOffers } from "@/lib/admin/private-offers";
import { listAdminGames } from "@/lib/cms/games";
import { PrivateOffersPageClient } from "./PrivateOffersPageClient";

export const dynamic = "force-dynamic";

export default async function PrivateOffersPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login?next=/admin/private-offers");

  const [offers, games] = await Promise.all([listPrivateOffers(), listAdminGames()]);
  return <PrivateOffersPageClient offers={offers} games={games} />;
}
