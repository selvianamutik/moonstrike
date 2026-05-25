import React from "react";
import { notFound } from "next/navigation";
import { getAdminServiceById } from "@/lib/admin-mock";
import { PreviewServicePageClient } from "./PreviewServicePageClient";

export default async function PreviewServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = getAdminServiceById(id);
  if (!service) notFound();
  return <PreviewServicePageClient service={service} />;
}
