import React from "react";
import { notFound } from "next/navigation";
import { ensureDefaultGenres } from "@/lib/cms/genres";
import { getAdminGame } from "@/lib/cms/games";
import { GameForm } from "../../GameForm";

export default async function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [genres, game] = await Promise.all([ensureDefaultGenres(), getAdminGame(id)]);
  if (!game) notFound();
  return <GameForm game={game} genres={genres} />;
}
