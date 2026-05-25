"use client";

import React, { useMemo, useState } from "react";
import { Plus, Gamepad2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminButton } from "@/components/admin/AdminButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ActionIcons } from "@/components/admin/ActionIcons";
import { adminGames, gameStats } from "@/lib/admin-mock";
import { CANONICAL_GAME_GENRES } from "@/lib/admin-constants";

export default function GamesPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("All Genres");

  const filtered = useMemo(() => {
    return adminGames.filter((game) => {
      const matchTab =
        activeTab === "all" ||
        (activeTab === "active" && game.status === "active") ||
        (activeTab === "draft" && game.status === "draft");
      const matchSearch =
        !search ||
        game.name.toLowerCase().includes(search.toLowerCase()) ||
        game.slug.toLowerCase().includes(search.toLowerCase());
      const matchGenre = genreFilter === "All Genres" || game.canonicalGenre === genreFilter;
      return matchTab && matchSearch && matchGenre;
    });
  }, [activeTab, search, genreFilter]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <AdminPageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Games", active: true }]}
        title="Games list"
        description="Manage supported game titles for the marketplace catalog."
        actions={
          <AdminButton href="/admin/games/new">
            <Plus size={16} />
            Add New Game
          </AdminButton>
        }
      />

      <div className="grid grid-cols-2 gap-6 max-w-xl">
        <AdminStatCard title="TOTAL GAMES" value={String(gameStats.totalGames)} trend="+12 this week" trendUp icon={<Gamepad2 size={18} className="text-[#22D3EE]" />} progressColor="bg-[#22D3EE]" progressWidth="w-[70%]" />
        <AdminStatCard title="TOTAL GENRES" value={String(gameStats.totalGenres)} subtitle="Canonical genre groups" icon={<Gamepad2 size={18} className="text-[#8B5CF6]" />} progressColor="bg-[#8B5CF6]" progressWidth="w-[50%]" />
      </div>

      <AdminFilterBar
        tabs={[
          { id: "all", label: "All Games" },
          { id: "active", label: "Active" },
          { id: "draft", label: "Draft" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchPlaceholder="Search games..."
        searchValue={search}
        onSearchChange={setSearch}
        statusOptions={["All Genres", ...CANONICAL_GAME_GENRES]}
        statusValue={genreFilter}
        onStatusChange={setGenreFilter}
        counter={`Showing 1-${filtered.length} of ${adminGames.length}`}
      />

      <AdminDataTable
        columns={["GAME NAME", "GENRE/TYPE", "PLATFORM", "STATUS", "ACTIONS"]}
        footer={<AdminPagination showingFrom={1} showingTo={filtered.length} total={adminGames.length} totalPages={2} />}
      >
        {filtered.map((game) => (
          <tr key={game.id} className="hover:bg-[#111827] transition-colors">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--ms-accent)] flex items-center justify-center text-xs font-bold text-[#8B5CF6]">
                  {game.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-white font-medium">{game.name}</div>
                  <div className="text-xs text-[#64748B] font-mono">{game.slug}</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 text-white text-sm">{game.canonicalGenre}</td>
            <td className="px-6 py-4">{game.displayPlatform}</td>
            <td className="px-6 py-4">
              <StatusBadge status={game.status} />
            </td>
            <td className="px-6 py-4">
              <ActionIcons editHref={`/admin/games/${game.id}/edit`} onHide={() => {}} onDelete={() => {}} />
            </td>
          </tr>
        ))}
      </AdminDataTable>
    </div>
  );
}
