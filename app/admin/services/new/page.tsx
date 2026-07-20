import React from "react";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ServiceForm } from "@/components/admin/ServiceForm";
import { getAdminSession } from "@/lib/admin/session";
import { listAdminGames } from "@/lib/cms/games";
import { listServiceCategories } from "@/lib/cms/service-categories";
import { listAdminServices, getAdminService, type ServiceRow } from "@/lib/cms/services";

export default async function NewServicePage(props: { searchParams?: Promise<{ clone?: string }> }) {
  const admin = await getAdminSession();
  const searchParams = props.searchParams ? await props.searchParams : {};
  const cloneId = searchParams.clone;

  if (!admin) {
    redirect("/admin/login?next=/admin/services/new");
  }

  const [games, categories, services] = await Promise.all([listAdminGames(), listServiceCategories(), listAdminServices()]);
  let cloneData: ServiceRow | undefined = undefined;
  if (cloneId) {
    const fetched = await getAdminService(cloneId);
    if (fetched) {
      fetched.title = `${fetched.title} (Copy)`;
      fetched.slug = `${fetched.slug}-copy`;
      fetched.status = "draft";
      cloneData = fetched;
    }
  }

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
      <ServiceForm categories={categories} games={games} services={services} service={cloneData} isClone={!!cloneId} />
    </div>
  );
}
