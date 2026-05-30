import React from "react";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ServiceForm } from "@/components/admin/ServiceForm";
import { getAdminSession } from "@/lib/admin/session";
import { listAdminGames } from "@/lib/cms/games";
import { listServiceCategories } from "@/lib/cms/service-categories";

export default async function NewServicePage() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin/login?next=/admin/services/new");
  }

  const [games, categories] = await Promise.all([listAdminGames(), listServiceCategories()]);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={[
          { label: "Marketplace" },
          { label: "Services", href: "/admin/services" },
          { label: "Create New Service", active: true },
        ]}
        title="Create New Service"
        description="Configure a new boosting or coaching offering for the marketplace."
      />
      <ServiceForm categories={categories} games={games} />
    </div>
  );
}
