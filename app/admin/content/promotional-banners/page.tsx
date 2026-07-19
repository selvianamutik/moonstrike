import React from "react";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getAdminSession } from "@/lib/admin/session";

export default async function PromotionalBannersPage() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin/login?next=/admin/content/promotional-banners");
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <AdminPageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Content", href: "/admin/content" }, { label: "Promotional Banners", active: true }]}
        title="Promotional Banners"
        description="Game-specific and regional promotional banners shown on the store front."
      />
      <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-12 text-center">
        <p className="text-[var(--admin-muted)]">Promotional banners management is coming soon.</p>
        <p className="mt-2 text-sm text-[var(--admin-muted)]">You can manage hero banners and landing sections from the Content Library.</p>
      </div>
    </div>
  );
}