import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { listAdminGames } from "@/lib/cms/games";
import { listServiceCategories } from "@/lib/cms/service-categories";
import { listAdminServices } from "@/lib/cms/services";
import { ServicesPageClient } from "./ServicesPageClient";

export default async function ServicesPage() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin/login?next=/admin/services");
  }

  const services = await listAdminServices();
  const [games, categories] = await Promise.all([listAdminGames(), listServiceCategories()]);

  return <ServicesPageClient categories={categories} games={games} services={services} />;
}
