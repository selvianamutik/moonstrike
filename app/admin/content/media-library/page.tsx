import React from "react";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getAdminSession } from "@/lib/admin/session";

export default async function MediaLibraryPage() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin/login?next=/admin/content/media-library");
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <AdminPageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Content", href: "/admin/content" }, { label: "Media Library", active: true }]}
        title="Media Library"
        description="All uploaded images and media assets used across the storefront and admin CMS."
      />
      <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-12 text-center">
        <p className="text-[var(--admin-muted)]">Media library management is coming soon.</p>
        <p className="mt-2 text-sm text-[var(--admin-muted)]">Images are currently uploaded directly through hero banners and content sections.</p>
      </div>
    </div>
  );
}