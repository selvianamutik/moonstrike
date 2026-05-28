"use client";

import React, { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminButton } from "@/components/admin/AdminButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ActionIcons } from "@/components/admin/ActionIcons";
import { adminServices, adminGames } from "@/lib/admin-mock";
import { SERVICE_CATEGORIES } from "@/lib/admin-constants";

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [gameFilter, setGameFilter] = useState("All Games");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  const filtered = useMemo(() => {
    return adminServices.filter((s) => {
      const matchTab =
        activeTab === "all" ||
        (activeTab === "active" && s.status === "active") ||
        (activeTab === "draft" && s.status === "draft");
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.slug.toLowerCase().includes(search.toLowerCase());
      const matchGame = gameFilter === "All Games" || s.gameName === gameFilter;
      const matchCat = categoryFilter === "All Categories" || s.serviceCategory === categoryFilter;
      return matchTab && matchSearch && matchGame && matchCat;
    });
  }, [activeTab, search, gameFilter, categoryFilter]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <AdminPageHeader
        breadcrumbs={[{ label: "Marketplace" }, { label: "Services", active: true }]}
        title="Service Catalog"
        description="Manage boosting and coaching services across all games."
        actions={
          <AdminButton href="/admin/services/new">
            <Plus size={16} />
            Add New Service
          </AdminButton>
        }
      />

      <AdminFilterBar
        tabs={[
          { id: "all", label: "All Services" },
          { id: "active", label: "Active" },
          { id: "draft", label: "Draft" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchPlaceholder="Search services..."
        searchValue={search}
        onSearchChange={setSearch}
        extra={
          <>
            <select
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value)}
              className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] text-white text-sm rounded-lg px-4 py-2.5"
            >
              <option>All Games</option>
              {adminGames.map((g) => (
                <option key={g.slug}>{g.name}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] text-white text-sm rounded-lg px-4 py-2.5"
            >
              <option>All Categories</option>
              {SERVICE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </>
        }
        counter={`Showing 1-${filtered.length} of ${adminServices.length}`}
      />

      <AdminDataTable
        columns={["SERVICE NAME", "GAME", "SERVICE CATEGORY", "BASE PRICE", "STATUS", "ACTIONS"]}
        footer={<AdminPagination showingFrom={1} showingTo={filtered.length} total={adminServices.length} totalPages={3} />}
      >
        {filtered.map((service) => (
          <tr key={service.id} className="hover:bg-[#111827] transition-colors">
            <td className="px-6 py-4">
              <div className="text-white font-medium">{service.offerTitle ?? service.name}</div>
              <div className="text-xs text-[#64748B] font-mono">ID: {service.slug}</div>
            </td>
            <td className="px-6 py-4 text-white">{service.gameName}</td>
            <td className="px-6 py-4">{service.serviceCategory}</td>
            <td className="px-6 py-4 text-[#22D3EE] font-medium">${service.basePriceUsd.toFixed(2)}</td>
            <td className="px-6 py-4">
              <StatusBadge status={service.status} />
            </td>
            <td className="px-6 py-4">
              <ActionIcons
                editHref={`/admin/services/${service.id}/edit`}
                previewHref={`/admin/services/${service.id}/preview`}
                onDelete={() => {}}
              />
            </td>
          </tr>
        ))}
      </AdminDataTable>
    </div>
  );
}
