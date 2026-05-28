import React from "react";
import { notFound } from "next/navigation";
import { getAdminContentById } from "@/lib/admin-mock";
import { ContentEditForm } from "./ContentEditForm";

export default async function ContentEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const content = getAdminContentById(id);
  if (!content) notFound();
  return <ContentEditForm content={content} />;
}
