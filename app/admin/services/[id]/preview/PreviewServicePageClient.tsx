"use client";

import React from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ServiceStorefrontPreview } from "@/components/admin/ServiceStorefrontPreview";
import type { AdminService } from "@/lib/admin-mock";

export function PreviewServicePageClient({ service }: { service: AdminService }) {
  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={[
          { label: "Marketplace" },
          { label: "Services", href: "/admin/services" },
          { label: "Preview", active: true },
        ]}
        title={`Preview: ${service.name}`}
      />
      <ServiceStorefrontPreview service={service} previewMode />
    </div>
  );
}
