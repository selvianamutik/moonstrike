import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { ensureDefaultGenres } from "@/lib/cms/genres";
import { GameForm } from "../GameForm";

export default async function NewGamePage() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin/login?next=/admin/games/new");
  }

  const genres = await ensureDefaultGenres();

  return <GameForm genres={genres} />;
}
