"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ServiceForm } from "@/components/admin/ServiceForm";
import type { AdminService } from "@/lib/admin-mock";

export function EditServicePageClient({ service }: { service: AdminService }) {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={[
          { label: "Marketplace" },
          { label: "Services", href: "/admin/services" },
          { label: "Edit", active: true },
        ]}
        title={`Edit: ${service.name}`}
      />
      <ServiceForm
        initial={service}
        onDiscard={() => router.push("/admin/services")}
        onSubmit={() => router.push("/admin/services")}
      />
    </div>
  );
}
