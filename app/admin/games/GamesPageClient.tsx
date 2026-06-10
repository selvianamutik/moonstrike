"use client";

import React, { useMemo, useState } from "react";
import { Archive, CheckCircle2, FileText, Gamepad2, Plus, Tags, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminButton } from "@/components/admin/AdminButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ActionIcons } from "@/components/admin/ActionIcons";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import type { GenreRow } from "@/lib/cms/genres";
import type { GameRow } from "@/lib/cms/games";

function getPlatform(game: GameRow) {
  return game.platforms[0] ?? "Cross-play";
}

function normalizeGenreName(value: string) {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function slugifyGenre(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function GamesPageClient({ games, genres }: { games: GameRow[]; genres: GenreRow[] }) {
  const [gameRows, setGameRows] = useState(games);
  const [genreRows, setGenreRows] = useState(genres);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("All Genres");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteError, setDeleteError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false);
  const [newGenreName, setNewGenreName] = useState("");
  const [newGenreSlug, setNewGenreSlug] = useState("");
  const [hasEditedGenreSlug, setHasEditedGenreSlug] = useState(false);
  const [genreError, setGenreError] = useState("");
  const [isCreatingGenre, setIsCreatingGenre] = useState(false);
  const [deletingGenreId, setDeletingGenreId] = useState("");
  const [pendingDeleteGenre, setPendingDeleteGenre] = useState<GenreRow | null>(null);
  const [pendingDeleteGame, setPendingDeleteGame] = useState<GameRow | null>(null);

  const filtered = useMemo(() => {
    return gameRows.filter((game) => {
      const matchTab =
        statusFilter === "all" ||
        (statusFilter === "active" && game.status === "active") ||
        (statusFilter === "draft" && game.status === "draft") ||
        (statusFilter === "archived" && game.status === "archived");
      const matchSearch =
        !search ||
        game.name.toLowerCase().includes(search.toLowerCase()) ||
        game.slug.toLowerCase().includes(search.toLowerCase());
      const matchGenre = genreFilter === "All Genres" || game.genre === genreFilter;
      return matchTab && matchSearch && matchGenre;
    });
  }, [gameRows, genreFilter, search, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedGames = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const showingFrom = filtered.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const showingTo = filtered.length > 0 ? showingFrom + pagedGames.length - 1 : 0;

  const activeCount = gameRows.filter((game) => game.status === "active").length;
  const draftCount = gameRows.filter((game) => game.status === "draft").length;
  const archivedCount = gameRows.filter((game) => game.status === "archived").length;
  const totalGenres = new Set(gameRows.map((game) => game.genre)).size;
  const activeProgress = gameRows.length > 0 ? Math.round((activeCount / gameRows.length) * 100) : 0;
  const genreOptions = useMemo(
    () => genreRows.map((genre) => genre.name).sort((a, b) => a.localeCompare(b)),
    [genreRows]
  );
  const genreUsageCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const game of gameRows) {
      if (!game.genre_id) continue;
      counts.set(game.genre_id, (counts.get(game.genre_id) ?? 0) + 1);
    }

    return counts;
  }, [gameRows]);

  async function createGenre(e: React.FormEvent) {
    e.preventDefault();

    const normalizedName = normalizeGenreName(newGenreName);

    if (!normalizedName) {
      setGenreError("Genre name is required.");
      return;
    }

    if (genreRows.some((genre) => genre.name.toLowerCase() === normalizedName.toLowerCase())) {
      setGenreError("This genre already exists.");
      return;
    }

    const normalizedSlug = slugifyGenre(newGenreSlug || normalizedName);

    if (!normalizedSlug) {
      setGenreError("Genre slug is required.");
      return;
    }

    if (genreRows.some((genre) => genre.slug.toLowerCase() === normalizedSlug.toLowerCase())) {
      setGenreError("This genre slug already exists.");
      return;
    }

    setGenreError("");
    setIsCreatingGenre(true);

    try {
      const response = await fetch("/api/admin/genres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: normalizedName, slug: normalizedSlug }),
      });
      const result = (await response.json().catch(() => null)) as {
        genre?: GenreRow;
        error?: string;
      } | null;

      if (!response.ok || !result?.genre) {
        setGenreError(result?.error ?? "Unable to create genre.");
        return;
      }

      setGenreRows((current) => [...current, result.genre as GenreRow].sort((a, b) => a.name.localeCompare(b.name)));
      setGenreFilter(result.genre.name);
      setNewGenreName("");
      setNewGenreSlug("");
      setHasEditedGenreSlug(false);
    } catch {
      setGenreError("Unable to reach the genre CMS endpoint.");
    } finally {
      setIsCreatingGenre(false);
    }
  }

  async function deleteGenre(genre: GenreRow) {
    if (deletingGenreId) return;

    const usedByGames = genreUsageCounts.get(genre.id) ?? 0;

    if (usedByGames > 0) {
      setGenreError(`Cannot delete - ${usedByGames} games use this genre.`);
      return;
    }

    setGenreError("");
    setDeletingGenreId(genre.id);

    try {
      const response = await fetch(`/api/admin/genres/${genre.id}`, { method: "DELETE" });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setGenreError(result?.error ?? "Unable to delete genre.");
        return;
      }

      setGenreRows((current) => current.filter((item) => item.id !== genre.id));

      if (genreFilter === genre.name) {
        setGenreFilter("All Genres");
      }
    } catch {
      setGenreError("Unable to reach the genre CMS endpoint.");
    } finally {
      setDeletingGenreId("");
      setPendingDeleteGenre(null);
    }
  }

  async function deleteGame(game: GameRow) {
    if (deletingId) return;

    setDeleteError("");
    setDeletingId(game.id);

    try {
      const response = await fetch(`/api/admin/games/${game.id}`, { method: "DELETE" });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setDeleteError(result?.error ?? "Unable to delete game.");
        return;
      }

      setGameRows((current) => current.filter((item) => item.id !== game.id));
    } catch {
      setDeleteError("Unable to reach the games CMS endpoint.");
    } finally {
      setDeletingId("");
      setPendingDeleteGame(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <AdminPageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Games", active: true }]}
        title="Games list"
        description="Manage supported game titles for the marketplace catalog."
        actions={
          <div className="flex flex-wrap gap-3">
            <AdminButton variant="secondary" onClick={() => setIsGenreModalOpen(true)}>
              <Plus size={16} />
              Add Genre
            </AdminButton>
            <AdminButton href="/admin/games/new">
              <Plus size={16} />
              Add New Game
            </AdminButton>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard title="TOTAL GAMES" value={String(gameRows.length)} icon={<Gamepad2 size={18} className="text-[#8B5CF6]" />} progressColor="bg-[#8B5CF6]" progressWidth="w-[65%]" />
        <AdminStatCard title="ACTIVE GAMES" value={String(activeCount)} icon={<CheckCircle2 size={18} className="text-[#22D3EE]" />} progressColor="bg-[#22D3EE]" progressPercent={activeProgress} />
        <AdminStatCard title="DRAFT GAMES" value={String(draftCount)} subtitle="Not visible yet" icon={<FileText size={18} className="text-amber-500" />} progressColor="bg-amber-500" progressWidth="w-[35%]" />
        <AdminStatCard title="ARCHIVED" value={String(archivedCount)} subtitle="Hidden titles" icon={<Archive size={18} className="text-[#94A3B8]" />} progressColor="bg-[#94A3B8]" progressWidth="w-[25%]" />
        <AdminStatCard title="TOTAL GENRES" value={String(totalGenres)} subtitle="Used by listed games" icon={<Tags size={18} className="text-green-500" />} progressColor="bg-green-500" progressWidth="w-[50%]" />
      </div>

      <AdminFilterBar
        searchPlaceholder="Search games..."
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        extra={
          <>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-[#172554] bg-[#0F172A] px-4 py-2.5 text-sm text-white outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <select
              value={genreFilter}
              onChange={(event) => {
                setGenreFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-[#172554] bg-[#0F172A] px-4 py-2.5 text-sm text-white outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
            >
              <option>All Genres</option>
              {genreOptions.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </>
        }
        counter={`Showing ${showingFrom}-${showingTo} of ${filtered.length}`}
      />

      {deleteError && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {deleteError}
        </p>
      )}

      <AdminDataTable
        columns={["GAME NAME", "GENRE/TYPE", "PLATFORM", "STATUS", "ACTIONS"]}
        footer={
          <AdminPagination
            showingFrom={showingFrom}
            showingTo={showingTo}
            total={filtered.length}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize);
              setPage(1);
            }}
          />
        }
      >
        {pagedGames.map((game) => (
          <tr key={game.id} className="hover:bg-[#111827] transition-colors">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                {game.image ? (
                  <img src={game.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[var(--ms-accent)] flex items-center justify-center text-xs font-bold text-[#8B5CF6]">
                    {game.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-white font-medium">{game.name}</div>
                  <div className="text-xs text-[#64748B] font-mono">{game.slug}</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 text-white text-sm">{game.genre}</td>
            <td className="px-6 py-4">{getPlatform(game)}</td>
            <td className="px-6 py-4">
              <StatusBadge status={game.status} />
            </td>
            <td className="px-6 py-4">
              <ActionIcons editHref={`/admin/games/${game.slug}/edit`} onDelete={() => setPendingDeleteGame(game)} />
              {deletingId === game.id && <span className="ml-2 text-xs text-[#94A3B8]">Deleting...</span>}
            </td>
          </tr>
        ))}
      </AdminDataTable>

      {isGenreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-xl border border-[#172554] bg-[#0F172A] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Add Genre</h2>
                <p className="mt-2 text-sm text-[#94A3B8]">
                  Genre names cannot be edited after creation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsGenreModalOpen(false);
                  setGenreError("");
                  setNewGenreName("");
                  setNewGenreSlug("");
                  setHasEditedGenreSlug(false);
                }}
                className="rounded-lg px-2 py-1 text-[#94A3B8] hover:bg-[#172554] hover:text-white"
                aria-label="Close add genre modal"
              >
                X
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={createGenre}>
              <div>
                <label htmlFor="genre-name" className="mb-2 block text-sm font-medium text-[#94A3B8]">
                  Genre Name
                </label>
                <input
                  id="genre-name"
                  value={newGenreName}
                  onChange={(event) => {
                    const nextName = event.target.value.toUpperCase();
                    setNewGenreName(nextName);
                    if (!hasEditedGenreSlug) setNewGenreSlug(slugifyGenre(nextName));
                    setGenreError("");
                  }}
                  placeholder="ACTION RPG"
                  className="w-full rounded-lg border border-[#172554] bg-[#111827] px-4 py-3 text-sm text-white outline-none placeholder:text-[#64748B] focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                />
              </div>
              <div>
                <label htmlFor="genre-slug" className="mb-2 block text-sm font-medium text-[#94A3B8]">
                  Slug
                </label>
                <input
                  id="genre-slug"
                  value={newGenreSlug}
                  onChange={(event) => {
                    setNewGenreSlug(slugifyGenre(event.target.value));
                    setHasEditedGenreSlug(true);
                    setGenreError("");
                  }}
                  placeholder="action-rpg"
                  className="w-full rounded-lg border border-[#172554] bg-[#111827] px-4 py-3 text-sm text-white outline-none placeholder:text-[#64748B] focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                />
                <p className="mt-2 text-xs text-[#64748B]">
                  Used for URLs and filters. Lowercase letters, numbers, and hyphens only.
                </p>
              </div>

              {genreError && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {genreError}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <AdminButton
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsGenreModalOpen(false);
                    setGenreError("");
                    setNewGenreName("");
                    setNewGenreSlug("");
                    setHasEditedGenreSlug(false);
                  }}
                >
                  Cancel
                </AdminButton>
                <AdminButton type="submit" disabled={isCreatingGenre}>
                  {isCreatingGenre ? "Saving..." : "Save Genre"}
                </AdminButton>
              </div>
            </form>

            <div className="mt-6 border-t border-[#172554] pt-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
                Existing Genres
              </h3>
              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                {genreRows.map((genre) => {
                  const usedByGames = genreUsageCounts.get(genre.id) ?? 0;
                  const isDeleteDisabled = usedByGames > 0 || deletingGenreId === genre.id;

                  return (
                    <div
                      key={genre.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[#172554] bg-[#111827] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{genre.name}</p>
                        <p className="text-xs text-[#64748B]">
                          {usedByGames > 0 ? `${usedByGames} games use this genre` : "Unused"}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isDeleteDisabled}
                        title={usedByGames > 0 ? `Cannot delete - ${usedByGames} games use this genre.` : "Delete genre"}
                        onClick={() => setPendingDeleteGenre(genre)}
                        className="rounded-lg p-2 text-[#94A3B8] transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#94A3B8]"
                        aria-label={`Delete ${genre.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDeleteGame)}
        title="Delete game?"
        description={
          pendingDeleteGame
            ? `This removes ${pendingDeleteGame.name} from the CMS game list. Related storefront links may stop resolving.`
            : ""
        }
        confirmLabel="Delete Game"
        variant="danger"
        isLoading={Boolean(pendingDeleteGame && deletingId === pendingDeleteGame.id)}
        onClose={() => {
          if (!deletingId) setPendingDeleteGame(null);
        }}
        onConfirm={() => {
          if (pendingDeleteGame) deleteGame(pendingDeleteGame);
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingDeleteGenre)}
        title="Delete genre?"
        description={pendingDeleteGenre ? `This permanently removes ${pendingDeleteGenre.name} from the genre list.` : ""}
        confirmLabel="Delete Genre"
        variant="danger"
        isLoading={Boolean(pendingDeleteGenre && deletingGenreId === pendingDeleteGenre.id)}
        onClose={() => {
          if (!deletingGenreId) setPendingDeleteGenre(null);
        }}
        onConfirm={() => {
          if (pendingDeleteGenre) deleteGenre(pendingDeleteGenre);
        }}
      />
    </div>
  );
}
