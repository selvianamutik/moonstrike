"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, TicketPercent, Trash2, X } from "lucide-react";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminFormField, adminInputClass } from "@/components/admin/AdminFormField";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ActionTooltip } from "@/components/common/ActionTooltip";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { createToast, ToastContainer, type Toast } from "@/components/Toast";
import type { VoucherWithStatus } from "@/lib/vouchers/types";

type VoucherForm = {
  code: string;
  discountPercentage: string;
  expiresAt: string;
};

type FormErrors = Partial<Record<keyof VoucherForm, string>>;

function toLocalDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function defaultExpiration() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  return toLocalDateTime(date.toISOString());
}

function emptyForm(): VoucherForm {
  return { code: "", discountPercentage: "", expiresAt: defaultExpiration() };
}

function formatExpiration(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function validateForm(form: VoucherForm, editing: boolean): FormErrors {
  const errors: FormErrors = {};
  const normalizedCode = form.code.trim().toUpperCase();
  const discount = Number(form.discountPercentage);
  const expiration = new Date(form.expiresAt);

  if (!editing && !/^[A-Z0-9]{1,64}$/.test(normalizedCode)) {
    errors.code = "Use 1 to 64 letters or numbers.";
  }

  if (!form.discountPercentage || !Number.isFinite(discount) || discount < 0 || discount > 100) {
    errors.discountPercentage = "Enter a percentage from 0 to 100.";
  }

  if (!form.expiresAt || Number.isNaN(expiration.getTime())) {
    errors.expiresAt = "Expiration date is required.";
  } else if (expiration.getTime() <= Date.now()) {
    errors.expiresAt = "Expiration date must be in the future.";
  }

  return errors;
}

export function AdminVoucherManager() {
  const [vouchers, setVouchers] = useState<VoucherWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState<VoucherWithStatus | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<VoucherForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [deleteTarget, setDeleteTarget] = useState<VoucherWithStatus | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const loadVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/vouchers", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as { vouchers?: VoucherWithStatus[]; error?: string } | null;
      if (!response.ok || !payload?.vouchers) throw new Error(payload?.error ?? "Failed to load vouchers.");
      setVouchers(payload.vouchers);
    } catch (error) {
      setToasts((current) => [...current, createToast("error", error instanceof Error ? error.message : "Failed to load vouchers.")]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVouchers();
  }, [loadVouchers]);

  function openCreateModal() {
    setEditing(null);
    setModalOpen(true);
    setForm(emptyForm());
    setErrors({});
  }

  function openEditModal(voucher: VoucherWithStatus) {
    setEditing(voucher);
    setModalOpen(true);
    setForm({
      code: voucher.code,
      discountPercentage: String(voucher.discountPercentage),
      expiresAt: toLocalDateTime(voucher.expiresAt),
    });
    setErrors({});
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm());
    setErrors({});
  }

  async function saveVoucher(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validateForm(form, Boolean(editing));
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const payload = editing
        ? {
            discountPercentage: Number(form.discountPercentage),
            expiresAt: new Date(form.expiresAt).toISOString(),
          }
        : {
            code: form.code.trim().toUpperCase(),
            discountPercentage: Number(form.discountPercentage),
            expiresAt: new Date(form.expiresAt).toISOString(),
          };
      const response = await fetch(editing ? `/api/admin/vouchers/${editing.id}` : "/api/admin/vouchers", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error ?? "Failed to save voucher.");
      setToasts((current) => [...current, createToast("success", editing ? `Voucher ${editing.code} updated.` : `Voucher ${form.code.trim().toUpperCase()} created.`)]);
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm());
      await loadVouchers();
    } catch (error) {
      setToasts((current) => [...current, createToast("error", error instanceof Error ? error.message : "Failed to save voucher.")]);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/vouchers/${deleteTarget.id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "Failed to delete voucher.");
      setToasts((current) => [...current, createToast("success", `Voucher ${deleteTarget.code} deleted.`)]);
      setDeleteTarget(null);
      await loadVouchers();
    } catch (error) {
      setToasts((current) => [...current, createToast("error", error instanceof Error ? error.message : "Failed to delete voucher.")]);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Content", href: "/admin/content" }, { label: "Vouchers", active: true }]}
        title="Voucher Management"
        description="Create and manage promotional discount codes for checkout."
      />

      <div className="flex items-center justify-between gap-4">
        <Link href="/admin/content" className="text-sm text-[var(--admin-muted)] transition-colors hover:text-white">
          &larr; Back to content
        </Link>
        <AdminButton onClick={openCreateModal}>
          <Plus size={16} className="mr-2" />
          Create Voucher
        </AdminButton>
      </div>

      <AdminDataTable
        title="Vouchers"
        columns={["CODE", "DISCOUNT", "EXPIRES", "STATUS", "ACTIONS"]}
      >
        {loading ? (
          <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-[var(--admin-muted)]">Loading vouchers...</td></tr>
        ) : vouchers.length === 0 ? (
          <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-[var(--admin-muted)]">No vouchers yet.</td></tr>
        ) : vouchers.map((voucher) => (
          <tr key={voucher.id} className="transition-colors hover:bg-[#111827]">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#C4B5FD]">
                  <TicketPercent size={16} />
                </span>
                <span className="font-mono font-semibold text-white">{voucher.code}</span>
              </div>
            </td>
            <td className="px-6 py-4 font-medium text-white">{voucher.discountPercentage}%</td>
            <td className="px-6 py-4 text-sm">{formatExpiration(voucher.expiresAt)}</td>
            <td className="px-6 py-4">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase ${voucher.status === "active" ? "border-green-500/20 bg-green-500/10 text-green-500" : "border-gray-500/20 bg-gray-500/10 text-gray-400"}`}>
                {voucher.status}
              </span>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-1">
                <ActionTooltip label="Edit">
                  <button type="button" onClick={() => openEditModal(voucher)} className="admin-action-icon hover:border-[#8B5CF6] hover:text-[#8B5CF6]" aria-label={`Edit voucher ${voucher.code}`}>
                    <Pencil size={16} />
                  </button>
                </ActionTooltip>
                <ActionTooltip label="Delete">
                  <button type="button" onClick={() => setDeleteTarget(voucher)} className="admin-action-icon hover:border-red-500 hover:text-red-400" aria-label={`Delete voucher ${voucher.code}`}>
                    <Trash2 size={16} />
                  </button>
                </ActionTooltip>
              </div>
            </td>
          </tr>
        ))}
      </AdminDataTable>

      {modalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-4" role="presentation">
          <section className="w-full max-w-lg rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="voucher-modal-title">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 id="voucher-modal-title" className="text-lg font-bold text-white">{editing ? "Edit Voucher" : "Create Voucher"}</h2>
                <p className="mt-1 text-sm text-[var(--admin-muted)]">{editing ? "Update the discount and expiration date." : "Add a new checkout discount code."}</p>
              </div>
              <button type="button" onClick={closeModal} disabled={saving} className="rounded-lg p-1.5 text-[var(--admin-muted)] transition-colors hover:bg-white/5 hover:text-white" aria-label="Close voucher dialog">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveVoucher} className="flex flex-col gap-5">
              <AdminFormField label="Voucher Code">
                <input
                  className={`${adminInputClass} uppercase disabled:cursor-not-allowed disabled:opacity-60`}
                  value={form.code}
                  onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                  disabled={Boolean(editing)}
                  autoComplete="off"
                  placeholder="SAVE20"
                />
                {errors.code ? <p className="mt-1.5 text-xs text-red-400">{errors.code}</p> : <p className="mt-1.5 text-xs text-[var(--admin-muted)]">Letters and numbers only. Code cannot be changed later.</p>}
              </AdminFormField>

              <AdminFormField label="Discount Percentage">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className={`${adminInputClass} pr-10`}
                    value={form.discountPercentage}
                    onChange={(event) => setForm((current) => ({ ...current, discountPercentage: event.target.value }))}
                    placeholder="20"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--admin-muted)]">%</span>
                </div>
                {errors.discountPercentage ? <p className="mt-1.5 text-xs text-red-400">{errors.discountPercentage}</p> : null}
              </AdminFormField>

              <AdminFormField label="Expiration Date">
                <input
                  type="datetime-local"
                  className={`${adminInputClass} [color-scheme:dark]`}
                  value={form.expiresAt}
                  onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))}
                />
                {errors.expiresAt ? <p className="mt-1.5 text-xs text-red-400">{errors.expiresAt}</p> : null}
              </AdminFormField>

              <div className="flex justify-end gap-3 pt-2">
                <AdminButton variant="secondary" onClick={closeModal} disabled={saving}>Cancel</AdminButton>
                <AdminButton type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Save Changes" : "Create Voucher"}</AdminButton>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete voucher?"
        description={deleteTarget ? `Are you sure you want to delete voucher ${deleteTarget.code}?` : ""}
        confirmLabel="Delete Voucher"
        variant="danger"
        isLoading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
