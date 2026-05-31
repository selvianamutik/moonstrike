import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ServiceForm } from "@/components/admin/ServiceForm";
import { ServiceDetail } from "@/components/service-detail";
import { getAdminSession } from "@/lib/admin/session";
import { listAdminGames } from "@/lib/cms/games";
import { listServiceCategories } from "@/lib/cms/service-categories";
import { getAdminService, getAdminServiceByGameAndSlug, type ServiceRow } from "@/lib/cms/services";

type AdminServiceAction = "edit" | "preview";

function isAction(value: string | undefined): value is AdminServiceAction {
  return value === "edit" || value === "preview";
}

async function resolveService(path: string[]) {
  if (path.length === 2 && isAction(path[1])) {
    const service = await getAdminService(path[0]);

    if (!service) return null;

    redirect(`/admin/services/${service.game_slug}/${service.slug}/${path[1]}`);
  }

  if (path.length === 3 && isAction(path[2])) {
    const service = await getAdminServiceByGameAndSlug(path[0], path[1]);
    return service ? { service, action: path[2] } : null;
  }

  return null;
}

function ServiceBreadcrumbs({ action, service }: { action: AdminServiceAction; service: ServiceRow }) {
  return [
    { label: "Marketplace" },
    { label: "Services", href: "/admin/services" },
    { label: service.game_name },
    { label: action === "edit" ? "Edit" : "Preview", active: true },
  ];
}

export default async function AdminServiceRoutePage({
  params,
}: {
  params: Promise<{ servicePath: string[] }>;
}) {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin/login?next=/admin/services");
  }

  const { servicePath } = await params;
  const resolved = await resolveService(servicePath);

  if (!resolved) notFound();

  if (resolved.action === "preview") {
    return (
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <AdminPageHeader
          breadcrumbs={ServiceBreadcrumbs({ action: resolved.action, service: resolved.service })}
          title={`Preview: ${resolved.service.title}`}
          actions={
            <Link
              href={`/admin/services/${resolved.service.game_slug}/${resolved.service.slug}/edit`}
              className="text-sm text-[#22D3EE] hover:underline"
            >
              Back to Editor
            </Link>
          }
        />
        <div className="overflow-hidden rounded-xl border border-[var(--ms-accent)]">
          <ServiceDetail service={resolved.service} previewMode showSiteChrome={false} />
        </div>
      </div>
    );
  }

  const [games, categories] = await Promise.all([listAdminGames(), listServiceCategories()]);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={ServiceBreadcrumbs({ action: resolved.action, service: resolved.service })}
        title={`Edit: ${resolved.service.title}`}
      />
      <ServiceForm categories={categories} games={games} service={resolved.service} />
    </div>
  );
}
