"use client";

import React, { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminButton } from "@/components/admin/AdminButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ActionIcons } from "@/components/admin/ActionIcons";
import type { GameRow } from "@/lib/cms/games";
import type { ServiceCategoryRow } from "@/lib/cms/service-categories";
import type { ServiceRow } from "@/lib/cms/services";

type CategoryFilterOption = {
  key: string;
  label: string;
  value: string;
  sortOrder: number;
};

const SERVICES_PER_PAGE = 20;
const HOT_OFFER_FILTER = "hot-offers";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function sortCategories(categories: ServiceCategoryRow[]) {
  return [...categories].sort(
    (a, b) =>
      a.sort_order - b.sort_order ||
      (a.game_name ?? "").localeCompare(b.game_name ?? "") ||
      a.name.localeCompare(b.name),
  );
}

function getCategoryFilterOptions(categories: ServiceCategoryRow[], gameFilter: string): CategoryFilterOption[] {
  if (gameFilter !== "all") {
    return sortCategories(categories.filter((category) => category.game_id === gameFilter)).map((category) => ({
      key: category.id,
      label: category.name,
      value: category.id,
      sortOrder: category.sort_order,
    }));
  }

  const options = new Map<string, CategoryFilterOption>();

  sortCategories(categories).forEach((category) => {
    const slug = category.slug || slugify(category.name);
    const existing = options.get(slug);

    if (!existing) {
      options.set(slug, {
        key: slug,
        label: category.name,
        value: `slug:${slug}`,
        sortOrder: category.sort_order,
      });
      return;
    }

    if (category.sort_order < existing.sortOrder) {
      options.set(slug, { ...existing, label: category.name, sortOrder: category.sort_order });
    }
  });

  return Array.from(options.values()).sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
}

export function ServicesPageClient({
  categories,
  games,
  services,
}: {
  categories: ServiceCategoryRow[];
  games: GameRow[];
  services: ServiceRow[];
}) {
  const [serviceRows, setServiceRows] = useState(services);
  const [categoryRows, setCategoryRows] = useState(categories);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [gameFilter, setGameFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryGameId, setCategoryGameId] = useState(games[0]?.id ?? "");
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [hasEditedSlug, setHasEditedSlug] = useState(false);
  const [sortOrder, setSortOrder] = useState("0");
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState("");
  const [deletingServiceId, setDeletingServiceId] = useState("");

  const availableCategories = useMemo(
    () => getCategoryFilterOptions(categoryRows, gameFilter),
    [categoryRows, gameFilter]
  );
  const modalCategories = useMemo(
    () => sortCategories(categoryRows.filter((category) => category.game_id === categoryGameId)),
    [categoryGameId, categoryRows]
  );

  const filtered = useMemo(() => {
    return serviceRows.filter((service) => {
      const matchTab =
        activeTab === "all" ||
        (activeTab === "active" && service.status === "active") ||
        (activeTab === "draft" && service.status === "draft") ||
        (activeTab === "archived" && service.status === "archived");
      const matchSearch =
        !search ||
        service.title.toLowerCase().includes(search.toLowerCase()) ||
        service.slug.toLowerCase().includes(search.toLowerCase());
      const matchGame = gameFilter === "all" || service.game_id === gameFilter;
      const matchCat =
        categoryFilter === "all" ||
        (categoryFilter === HOT_OFFER_FILTER && service.is_hot_offer) ||
        (categoryFilter.startsWith("slug:")
          ? service.service_category_slug === categoryFilter.replace("slug:", "")
          : service.service_category_id === categoryFilter);

      return matchTab && matchSearch && matchGame && matchCat;
    }).sort(
      (a, b) =>
        a.game_name.localeCompare(b.game_name) ||
        (a.service_category_sort_order ?? 999) - (b.service_category_sort_order ?? 999) ||
        (a.service_category_name ?? "").localeCompare(b.service_category_name ?? "") ||
        a.title.localeCompare(b.title),
    );
  }, [activeTab, categoryFilter, gameFilter, search, serviceRows]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / SERVICES_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedServices = filtered.slice((currentPage - 1) * SERVICES_PER_PAGE, currentPage * SERVICES_PER_PAGE);
  const showingFrom = filtered.length > 0 ? (currentPage - 1) * SERVICES_PER_PAGE + 1 : 0;
  const showingTo = filtered.length > 0 ? showingFrom + pagedServices.length - 1 : 0;

  function resetPage() {
    setPage(1);
  }

  function resetCategoryModal() {
    setCategoryName("");
    setCategorySlug("");
    setHasEditedSlug(false);
    setSortOrder("0");
    setEditingCategoryId("");
    setError("");
  }

  function editCategory(category: ServiceCategoryRow) {
    setEditingCategoryId(category.id);
    setCategoryGameId(category.game_id);
    setCategoryName(category.name);
    setCategorySlug(category.slug);
    setSortOrder(String(category.sort_order));
    setHasEditedSlug(true);
    setError("");
    setIsCategoryModalOpen(true);
  }

  async function saveCategory(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSavingCategory(true);

    try {
      const response = await fetch(
        editingCategoryId ? `/api/admin/service-categories/${editingCategoryId}` : "/api/admin/service-categories",
        {
          method: editingCategoryId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameId: categoryGameId,
            name: categoryName,
            slug: categorySlug,
            sortOrder: Number(sortOrder),
          }),
        }
      );
      const result = (await response.json().catch(() => null)) as {
        category?: ServiceCategoryRow;
        error?: string;
      } | null;

      if (!response.ok || !result?.category) {
        setError(result?.error ?? "Unable to create service category.");
        return;
      }

      setCategoryRows((current) => {
        const next = editingCategoryId
          ? current.map((category) => category.id === result.category?.id ? result.category as ServiceCategoryRow : category)
          : [...current, result.category as ServiceCategoryRow];

        return sortCategories(next);
      });
      setServiceRows((current) =>
        current.map((service) =>
          service.service_category_id === result.category?.id
            ? {
                ...service,
                service_category_name: result.category.name,
                service_category_slug: result.category.slug,
                service_category_sort_order: result.category.sort_order,
              }
            : service
        )
      );
      setCategoryFilter(gameFilter === "all" ? `slug:${result.category.slug}` : result.category.id);
      resetCategoryModal();
      setIsCategoryModalOpen(false);
    } catch {
      setError("Unable to reach the service category endpoint.");
    } finally {
      setIsSavingCategory(false);
    }
  }

  async function deleteCategory(category: ServiceCategoryRow) {
    if (deletingCategoryId) return;
    const confirmed = window.confirm(
      `Delete ${category.name}? Services assigned to this category will have their category cleared.`
    );

    if (!confirmed) return;

    setError("");
    setDeletingCategoryId(category.id);

    try {
      const response = await fetch(`/api/admin/service-categories/${category.id}`, { method: "DELETE" });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(result?.error ?? "Unable to delete service category.");
        return;
      }

      setCategoryRows((current) => current.filter((item) => item.id !== category.id));
      setServiceRows((current) =>
        current.map((service) =>
          service.service_category_id === category.id
            ? {
                ...service,
                service_category_id: null,
                service_category_name: null,
                service_category_slug: null,
                service_category_sort_order: null,
              }
            : service
        )
      );
      if (categoryFilter === category.id || categoryFilter === `slug:${category.slug}`) setCategoryFilter("all");
    } catch {
      setError("Unable to reach the service category endpoint.");
    } finally {
      setDeletingCategoryId("");
    }
  }

  async function deleteService(service: ServiceRow) {
    if (deletingServiceId) return;
    const confirmed = window.confirm(`Delete ${service.title}?`);

    if (!confirmed) return;

    setError("");
    setDeletingServiceId(service.id);

    try {
      const response = await fetch(`/api/admin/services/${service.id}`, { method: "DELETE" });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(result?.error ?? "Unable to delete service.");
        return;
      }

      setServiceRows((current) => current.filter((item) => item.id !== service.id));
    } catch {
      setError("Unable to reach the services endpoint.");
    } finally {
      setDeletingServiceId("");
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <AdminPageHeader
        breadcrumbs={[{ label: "Marketplace" }, { label: "Services", active: true }]}
        title="Service Catalog"
        description="Manage boosting and coaching services across all games."
        actions={
          <div className="flex flex-wrap gap-3">
            <AdminButton variant="secondary" onClick={() => setIsCategoryModalOpen(true)}>
              <Plus size={16} />
              New Service Category
            </AdminButton>
            <AdminButton href="/admin/services/new">
              <Plus size={16} />
              Add New Service
            </AdminButton>
          </div>
        }
      />

      <AdminFilterBar
        tabs={[
          { id: "all", label: "All Services" },
          { id: "active", label: "Active" },
          { id: "draft", label: "Draft" },
          { id: "archived", label: "Archived" },
        ]}
        activeTab={activeTab}
        onTabChange={(nextTab) => {
          setActiveTab(nextTab);
          resetPage();
        }}
        searchPlaceholder="Search services..."
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          resetPage();
        }}
        extra={
          <>
            <select
              value={gameFilter}
              onChange={(e) => {
                setGameFilter(e.target.value);
                setCategoryFilter("all");
                resetPage();
              }}
              className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] text-white text-sm rounded-lg px-4 py-2.5"
            >
              <option value="all">All Games</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                resetPage();
              }}
              className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] text-white text-sm rounded-lg px-4 py-2.5"
            >
              <option value="all">All Categories</option>
              <option value={HOT_OFFER_FILTER}>Hot Offers</option>
              {availableCategories.map((category) => (
                <option key={category.key} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </>
        }
        counter={`Showing ${showingFrom}-${showingTo} of ${filtered.length}`}
      />

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <AdminDataTable
        columns={["SERVICE", "GAME", "SERVICE CATEGORY", "BASE PRICE", "STATUS", "ACTIONS"]}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <AdminPagination
              showingFrom={showingFrom}
              showingTo={showingTo}
              total={filtered.length}
              totalPages={totalPages}
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="rounded-lg border border-[#172554] px-3 py-2 text-xs font-semibold text-[#94A3B8] transition-colors hover:border-[#22D3EE] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-[#64748B]">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                className="rounded-lg border border-[#172554] px-3 py-2 text-xs font-semibold text-[#94A3B8] transition-colors hover:border-[#22D3EE] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        }
      >
        {pagedServices.map((service) => (
          <tr key={service.id} className="hover:bg-[#111827] transition-colors">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                {service.image ? (
                  <img src={service.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#172554] bg-[#050816] text-xs font-bold text-[#64748B]">
                    MS
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate text-white font-medium">{service.title}</div>
                  <div className="truncate text-xs text-[#64748B] font-mono">ID: {service.slug}</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 text-white">{service.game_name}</td>
            <td className="px-6 py-4">{service.service_category_name ?? "Uncategorised"}</td>
            <td className="px-6 py-4 text-[#22D3EE] font-medium">${service.base_price_usd.toFixed(2)}</td>
            <td className="px-6 py-4">
              <StatusBadge status={service.status} />
            </td>
            <td className="px-6 py-4">
              <ActionIcons
                editHref={`/admin/services/${service.game_slug}/${service.slug}/edit`}
                previewHref={`/admin/services/${service.game_slug}/${service.slug}/preview`}
                onDelete={() => deleteService(service)}
              />
              {deletingServiceId === service.id && <span className="ml-2 text-xs text-[#94A3B8]">Deleting...</span>}
            </td>
          </tr>
        ))}
      </AdminDataTable>

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-2xl rounded-xl border border-[#172554] bg-[#0F172A] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">{editingCategoryId ? "Edit Service Category" : "Add Service Category"}</h2>
                <p className="mt-2 text-sm text-[#94A3B8]">
                  Categories are scoped per game and control the storefront service tabs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  resetCategoryModal();
                }}
                className="rounded-lg px-2 py-1 text-[#94A3B8] hover:bg-[#172554] hover:text-white"
                aria-label="Close service category modal"
              >
                X
              </button>
            </div>

            <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={saveCategory}>
              <label className="block text-sm font-medium text-[#94A3B8]">
                <span className="mb-2 block">Game</span>
                <select
                  value={categoryGameId}
                  onChange={(e) => setCategoryGameId(e.target.value)}
                  className="w-full rounded-lg border border-[#172554] bg-[#111827] px-4 py-3 text-sm text-white outline-none focus:border-[#8B5CF6]"
                >
                  {games.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-[#94A3B8]">
                <span className="mb-2 block">Sort Order</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full rounded-lg border border-[#172554] bg-[#111827] px-4 py-3 text-sm text-white outline-none focus:border-[#8B5CF6]"
                />
              </label>
              <label className="block text-sm font-medium text-[#94A3B8]">
                <span className="mb-2 block">Category Name</span>
                <input
                  value={categoryName}
                  onChange={(e) => {
                    setCategoryName(e.target.value);
                    if (!hasEditedSlug) setCategorySlug(slugify(e.target.value));
                  }}
                  className="w-full rounded-lg border border-[#172554] bg-[#111827] px-4 py-3 text-sm text-white outline-none focus:border-[#8B5CF6]"
                  placeholder="Dungeon"
                />
              </label>
              <label className="block text-sm font-medium text-[#94A3B8]">
                <span className="mb-2 block">Slug</span>
                <input
                  value={categorySlug}
                  onChange={(e) => {
                    setCategorySlug(slugify(e.target.value));
                    setHasEditedSlug(true);
                  }}
                  className="w-full rounded-lg border border-[#172554] bg-[#111827] px-4 py-3 text-sm text-white outline-none focus:border-[#8B5CF6]"
                  placeholder="dungeon"
                />
              </label>
              <div className="md:col-span-2 flex justify-end gap-3">
                <AdminButton
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsCategoryModalOpen(false);
                    resetCategoryModal();
                  }}
                >
                  Cancel
                </AdminButton>
                <AdminButton type="submit" disabled={isSavingCategory}>
                  {isSavingCategory ? "Saving..." : editingCategoryId ? "Save Changes" : "Save Category"}
                </AdminButton>
              </div>
            </form>

            <div className="mt-6 border-t border-[#172554] pt-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
                Existing Categories
              </h3>
              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                {modalCategories.length > 0 ? (
                  modalCategories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[#172554] bg-[#111827] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{category.name}</p>
                        <p className="text-xs text-[#64748B]">
                          {category.game_name ?? "Game"} / {category.slug}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => editCategory(category)}
                          className="rounded-lg p-2 text-[#94A3B8] transition-colors hover:bg-[#172554] hover:text-[#22D3EE]"
                          aria-label={`Edit ${category.name}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          disabled={deletingCategoryId === category.id}
                          onClick={() => deleteCategory(category)}
                          className="rounded-lg p-2 text-[#94A3B8] transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Delete ${category.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-dashed border-[#172554] px-3 py-4 text-sm text-[#94A3B8]">
                    No categories for the selected game yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
