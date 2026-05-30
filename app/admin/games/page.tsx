import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { ensureDefaultGenres } from "@/lib/cms/genres";
import { ensureDefaultGames } from "@/lib/cms/games";
import { GamesPageClient } from "./GamesPageClient";

export default async function GamesPage() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin/login?next=/admin/games");
  }

  const [genres, games] = await Promise.all([ensureDefaultGenres(), ensureDefaultGames()]);

  return <GamesPageClient games={games} genres={genres} />;
}
