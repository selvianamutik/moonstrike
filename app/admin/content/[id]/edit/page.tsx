import React from "react";
import { notFound } from "next/navigation";
import { getAdminContentBlock } from "@/lib/cms/landing";
import { ContentEditForm } from "./ContentEditForm";

export default async function ContentEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const content = await getAdminContentBlock(id);
  if (!content) notFound();
  if (content.type !== "hero" && content.type !== "benefits_section") notFound();

  return <ContentEditForm content={content} />;
}
