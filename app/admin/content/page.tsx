"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Eye, MoreVertical, LayoutGrid, List } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminButton } from "@/components/admin/AdminButton";
import { StatusBadge, type StatusType } from "@/components/admin/StatusBadge";
import { adminContent } from "@/lib/admin-mock";

const tabs = [
  { id: "landing", label: "LANDING PAGE SECTIONS" },
  { id: "banners", label: "PROMOTIONAL BANNERS" },
  { id: "media", label: "MEDIA LIBRARY" },
] as const;

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("landing");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const filtered = useMemo(() => adminContent.filter((c) => c.tab === activeTab), [activeTab]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <AdminPageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Content", active: true }]}
        title="Content Library"
        description="One content set for both dark and light mode — theme is CSS only."
        actions={
          <AdminButton href="/admin/content/c1/edit">
            <Plus size={16} />
            Add New Content
          </AdminButton>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-lg text-xs font-bold tracking-wide transition-colors ${
                activeTab === tab.id
                  ? "bg-[#8B5CF6] text-white"
                  : "text-[var(--ms-text-secondary)] border border-[var(--ms-accent)] hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-[#8B5CF6] text-white" : "text-[var(--ms-text-secondary)]"}`}
            aria-label="Grid view"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg ${viewMode === "list" ? "bg-[#8B5CF6] text-white" : "text-[var(--ms-text-secondary)]"}`}
            aria-label="List view"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {viewMode === "list" ? (
        <AdminDataTable
          columns={["CONTENT ITEM", "TYPE", "STATUS", "MODIFIED", "ACTIONS"]}
          footer={<AdminPagination showingFrom={1} showingTo={filtered.length} total={128} totalPages={32} />}
        >
          {filtered.map((item) => (
            <tr key={item.id} className="hover:bg-[#111827] transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 rounded bg-[var(--ms-accent)]" />
                  <div>
                    <div className="text-white font-medium">
                      {item.tab === "media" ? item.filename : item.title}
                    </div>
                    <div className="text-xs text-[#64748B] font-mono">ID: {item.id}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm">
                {item.tab === "landing"
                  ? item.blockType
                  : item.tab === "banners"
                    ? "Promo Banner"
                    : item.tab === "media"
                      ? "Media"
                      : "—"}
                {item.tab === "banners" && "gameName" in item && item.gameName && (
                  <span className="block text-xs text-[#64748B]">{item.gameName}</span>
                )}
                {item.tab === "media" && "usedIn" in item && (
                  <span className="block text-xs text-[#64748B]">Used in {item.usedIn} places</span>
                )}
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={item.status as StatusType} />
              </td>
              <td className="px-6 py-4">{item.modified}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1">
                  <Link href={`/admin/content/${item.id}/edit`} className="p-2 text-[var(--ms-text-secondary)] hover:text-[#8B5CF6]">
                    <Pencil size={16} />
                  </Link>
                  <button type="button" className="p-2 text-[var(--ms-text-secondary)] hover:text-[#22D3EE]">
                    <Eye size={16} />
                  </button>
                  <button type="button" className="p-2 text-[var(--ms-text-secondary)] hover:text-white">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminDataTable>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-4 hover:border-[#8B5CF6]">
              <div className="h-24 bg-[var(--ms-accent)] rounded-lg mb-3" />
              <div className="text-white font-medium text-sm mb-1">
                {item.tab === "media" ? item.filename : item.title}
              </div>
              <StatusBadge status={item.status as StatusType} />
              <Link href={`/admin/content/${item.id}/edit`} className="text-xs text-[#22D3EE] mt-2 inline-block hover:underline">
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
