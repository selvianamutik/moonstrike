import React from "react";
import { notFound } from "next/navigation";
import { getAdminGameById } from "@/lib/admin-mock";
import { EditGameForm } from "./EditGameForm";

export default async function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = getAdminGameById(id);
  if (!game) notFound();
  return <EditGameForm game={game} />;
}
