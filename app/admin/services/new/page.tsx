"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ServiceForm } from "@/components/admin/ServiceForm";

export default function NewServicePage() {
  const router = useRouter();

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
      <ServiceForm onDiscard={() => router.push("/admin/services")} onSubmit={() => router.push("/admin/services")} />
    </div>
  );
}
