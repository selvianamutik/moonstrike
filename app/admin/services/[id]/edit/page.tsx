import React from "react";
import { notFound, redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ServiceForm } from "@/components/admin/ServiceForm";
import { getAdminSession } from "@/lib/admin/session";
import { listAdminGames } from "@/lib/cms/games";
import { listServiceCategories } from "@/lib/cms/service-categories";
import { getAdminService } from "@/lib/cms/services";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin/login?next=/admin/services");
  }

  const { id } = await params;
  const [games, categories, service] = await Promise.all([
    listAdminGames(),
    listServiceCategories(),
    getAdminService(id),
  ]);

  if (!service) notFound();

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={[
          { label: "Marketplace" },
          { label: "Services", href: "/admin/services" },
          { label: "Edit", active: true },
        ]}
        title={`Edit: ${service.title}`}
      />
      <ServiceForm categories={categories} games={games} service={service} />
    </div>
  );
}
