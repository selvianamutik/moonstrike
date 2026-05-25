import React from "react";
import { notFound } from "next/navigation";
import { getAdminServiceById } from "@/lib/admin-mock";
import { EditServicePageClient } from "./EditServicePageClient";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = getAdminServiceById(id);
  if (!service) notFound();
  return <EditServicePageClient service={service} />;
}
