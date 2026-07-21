"use client";

import React, { useState } from "react";
import { Copy, ExternalLink, Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminFormField, adminInputClass, adminSelectClass, adminTextareaClass } from "@/components/admin/AdminFormField";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import type { GameRow } from "@/lib/cms/games";
import type { PrivateOfferRow } from "@/lib/admin/private-offers";

type FormState = {
  gameId: string;
  quantity: string;
  platform: string;
  category: string;
  priceUsd: string;
  discountPercent: string;
  title: string;
  additionalInfo: string;
  slug: string;
  hasEditedSlug: boolean;
};

const emptyForm: FormState = {
  gameId: "",
  quantity: "1",
  platform: "",
  category: "boosting",
  priceUsd: "",
  discountPercent: "0",
  title: "",
  additionalInfo: "",
  slug: "",
  hasEditedSlug: false,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function PrivateOffersPageClient({
  offers: initialOffers,
  games,
}: {
  offers: PrivateOfferRow[];
  games: GameRow[];
}) {
  const [offers, setOffers] = useState(initialOffers);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PrivateOfferRow | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [form, setForm] = useState<FormState>(emptyForm);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const totalPages = Math.max(1, Math.ceil(offers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedOffers = offers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function openEdit(offer: PrivateOfferRow) {
    setForm({
      gameId: offer.game_id,
      quantity: String(offer.quantity),
      platform: offer.platform,
      category: offer.category,
      priceUsd: String(offer.price_usd),
      discountPercent: String(offer.discount_percent),
      title: offer.title,
      additionalInfo: offer.additional_info,
      slug: offer.slug,
      hasEditedSlug: true,
    });
    setEditingId(offer.id);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    const body = {
      gameId: form.gameId,
      quantity: Number(form.quantity),
      platform: form.platform,
      category: form.category,
      priceUsd: Number(form.priceUsd),
      discountPercent: Number(form.discountPercent),
      title: form.title,
      additionalInfo: form.additionalInfo,
      slug: form.slug || slugify(form.title),
    };

    try {
      const url = editingId
        ? `/api/admin/private-offers/${editingId}`
        : "/api/admin/private-offers";
      const method = editingId ? "PATCH" : "POST";
      const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.error ?? "Failed to save.");
        return;
      }

      if (editingId) {
        setOffers((prev) => prev.map((o) => (o.id === editingId ? result.offer : o)));
      } else {
        setOffers((prev) => [result.offer, ...prev]);
      }

      setIsModalOpen(false);
      resetForm();
    } catch {
      setError("Network error.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(offer: PrivateOfferRow) {
    if (deletingId) return;
    setDeletingId(offer.id);
    try {
      const response = await fetch(`/api/admin/private-offers/${offer.id}`, { method: "DELETE" });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setError(result?.error ?? "Failed to delete.");
        return;
      }
      setOffers((prev) => prev.filter((o) => o.id !== offer.id));
    } catch {
      setError("Network error.");
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  }

  async function copyLink(slug: string) {
    const link = `${origin}/offer/${slug}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    } catch {
      // fallback
    }
  }

  const finalPrice = (offer: PrivateOfferRow) => {
    const discounted = offer.price_usd * (1 - offer.discount_percent / 100);
    return discounted.toFixed(2);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <AdminPageHeader
        breadcrumbs={[{ label: "Marketplace" }, { label: "Private Offers", active: true }]}
        title="Private Offers"
        description="Create exclusive offers with shareable links for specific customers."
        actions={
          <AdminButton onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <Plus size={16} /> New Private Offer
          </AdminButton>
        }
      />

      <AdminDataTable
        columns={["TITLE", "GAME", "CATEGORY", "PRICE", "LINK", "ACTIONS"]}
        footer={
          <AdminPagination
            showingFrom={pagedOffers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            showingTo={(currentPage - 1) * pageSize + pagedOffers.length}
            total={offers.length}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={() => {}}
          />
        }
      >
        {pagedOffers.length === 0 ? (
          <tr>
            <td className="px-6 py-8 text-center text-[var(--ms-text-secondary)]" colSpan={6}>No private offers yet.</td>
          </tr>
        ) : (
          pagedOffers.map((offer) => (
            <tr key={offer.id} className="transition-colors hover:bg-[#111827]">
              <td className="px-6 py-4">
                <p className="text-white font-medium">{offer.title}</p>
                {offer.additional_info && <p className="text-xs text-[#64748B] truncate max-w-[200px]">{offer.additional_info}</p>}
              </td>
              <td className="px-6 py-4 text-[#94A3B8]">{offer.game_name ?? "—"}</td>
              <td className="px-6 py-4 capitalize text-[#94A3B8]">{offer.category}</td>
              <td className="px-6 py-4">
                <span className="text-[#22D3EE] font-medium">${finalPrice(offer)}</span>
                {offer.discount_percent > 0 && (
                  <span className="ml-2 text-xs text-[#64748B] line-through">${offer.price_usd.toFixed(2)}</span>
                )}
                {offer.discount_percent > 0 && (
                  <span className="ml-1 text-xs text-green-400">-{offer.discount_percent}%</span>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <AdminButton
                    variant="ghost"
                    onClick={() => copyLink(offer.slug)}
                    className="gap-1 px-3 py-1.5 text-xs"
                  >
                    <Copy size={14} />
                    {copiedSlug === offer.slug ? "Copied!" : "Copy Link"}
                  </AdminButton>
                  <a
                    href={`/offer/${offer.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#64748B] hover:text-[#22D3EE] transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(offer)}
                    className="admin-action-icon hover:border-[#22D3EE] hover:text-[#22D3EE]"
                    aria-label="Edit"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button
                    onClick={() => setPendingDelete(offer)}
                    className="admin-action-icon hover:border-red-500/30 hover:text-red-300"
                    aria-label="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </AdminDataTable>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-[var(--ms-accent)] bg-[var(--ms-secondary)] p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">{editingId ? "Edit Private Offer" : "New Private Offer"}</h2>
            {error && <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</p>}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <AdminFormField label="Game">
                <select className={adminSelectClass} value={form.gameId} onChange={(e) => setForm((f) => ({ ...f, gameId: e.target.value }))} required>
                  <option value="">Select game</option>
                  {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </AdminFormField>

              <div className="grid grid-cols-2 gap-4">
                <AdminFormField label="Quantity">
                  <input type="number" min={1} className={adminInputClass} value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
                </AdminFormField>
                <AdminFormField label="Platform">
                  <input className={adminInputClass} value={form.platform} onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))} placeholder="PC, PS5, etc." />
                </AdminFormField>
              </div>

              <AdminFormField label="Category">
                <select className={adminSelectClass} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  <option value="boosting">Boosting</option>
                  <option value="coaching">Coaching</option>
                  <option value="playmate">Playmate</option>
                </select>
              </AdminFormField>

              <div className="grid grid-cols-2 gap-4">
                <AdminFormField label="Price (USD)">
                  <input type="number" step="0.01" min={0} className={adminInputClass} value={form.priceUsd} onChange={(e) => setForm((f) => ({ ...f, priceUsd: e.target.value }))} required />
                </AdminFormField>
                <AdminFormField label="Discount (%)">
                  <input type="number" step="0.1" min={0} max={100} className={adminInputClass} value={form.discountPercent} onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))} />
                </AdminFormField>
              </div>

              <AdminFormField label="Title">
                <input className={adminInputClass} value={form.title} onChange={(e) => {
                  const title = e.target.value;
                  setForm((f) => ({
                    ...f,
                    title,
                    slug: f.hasEditedSlug ? f.slug : slugify(title),
                  }));
                }} required />
              </AdminFormField>

              <AdminFormField label="Slug (URL)">
                <input className={adminInputClass} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value), hasEditedSlug: true }))} required />
              </AdminFormField>

              <AdminFormField label="Additional Info">
                <textarea className={adminTextareaClass} rows={3} value={form.additionalInfo} onChange={(e) => setForm((f) => ({ ...f, additionalInfo: e.target.value }))} placeholder="Describe the offer details..." />
              </AdminFormField>

              <div className="flex justify-end gap-3 pt-2">
                <AdminButton type="button" variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>Cancel</AdminButton>
                <AdminButton type="submit" disabled={isSaving}>{isSaving ? "Saving..." : editingId ? "Save Changes" : "Create Offer"}</AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete Private Offer"
        description={pendingDelete ? `Are you sure you want to delete "${pendingDelete.title}"? This cannot be undone.` : ""}
        confirmLabel="Delete"
        variant="danger"
        isLoading={Boolean(deletingId)}
        onClose={() => { if (!deletingId) setPendingDelete(null); }}
        onConfirm={() => { if (pendingDelete) handleDelete(pendingDelete); }}
      />
    </div>
  );
}
