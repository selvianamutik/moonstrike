import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ServiceDetail } from "@/components/service-detail";
import { getAdminSession } from "@/lib/admin/session";
import { getAdminService } from "@/lib/cms/services";

export default async function PreviewServicePage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin/login?next=/admin/services");
  }

  const { id } = await params;
  const service = await getAdminService(id);

  if (!service) notFound();

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={[
          { label: "Marketplace" },
          { label: "Services", href: "/admin/services" },
          { label: "Preview", active: true },
        ]}
        title={`Preview: ${service.title}`}
        actions={
          <Link href={`/admin/services/${service.id}/edit`} className="text-sm text-[#22D3EE] hover:underline">
            Back to Editor
          </Link>
        }
      />
      <div className="overflow-hidden rounded-xl border border-[var(--ms-accent)]">
        <ServiceDetail service={service} previewMode showSiteChrome={false} />
      </div>
    </div>
  );
}
