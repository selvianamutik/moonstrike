"use client";

import React, { useEffect, useState } from "react";
import { ExternalLink, FileText, BookOpen, Compass, Eye, Image as ImageIcon, Plus, Trash2, X } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminFormField, adminInputClass } from "@/components/admin/AdminFormField";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { getCategoryPrefix, getPageRoutePrefix, type CustomPageRow } from "@/lib/admin/custom-pages";
import { cleanupUploadedMedia } from "@/lib/cms/client-media-cleanup";

function loadImage(file: Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Unable to read image.")); };
    image.src = url;
  });
}

async function resizeToWebp(file: File, maxWidth: number, quality: number) {
  const image = await loadImage(file);
  const scale = Math.min(1, maxWidth / image.naturalWidth);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Browser image compression is unavailable.");
  context.drawImage(image, 0, 0, width, height);
  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { reject(new Error("Unable to compress image.")); return; }
        resolve(new File([blob], "page-image.webp", { type: "image/webp" }));
      },
      "image/webp",
      quality,
    );
  });
}
import { QuillEditor } from "@/components/admin/QuillEditor";

type FormState = {
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  image: string;
  category: "page" | "blog" | "guide";
  status: string;
  hasEditedSlug: boolean;
};

const emptyForm: FormState = {
  title: "",
  slug: "",
  content: "",
  metaDescription: "",
  image: "",
  category: "page",
  status: "draft",
  hasEditedSlug: false,
};

const categoryMeta = {
  page: { icon: FileText, label: "Page", desc: "Standalone page like Terms, Privacy, About" },
  blog: { icon: BookOpen, label: "Blog", desc: "Blog post with /blog/ prefix in URL" },
  guide: { icon: Compass, label: "Guide", desc: "Guide article with /guide/ prefix in URL" },
} as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getFullPreviewUrl(slug: string, category: string) {
  const prefix = getCategoryPrefix(category);
  return `${prefix}/${slug || "..."}`;
}

export function PagesPageClient({ pages: initialPages }: { pages: CustomPageRow[] }) {
  const [pages, setPages] = useState(initialPages);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [draftImageFile, setDraftImageFile] = useState<File | null>(null);
  const [draftImagePreview, setDraftImagePreview] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CustomPageRow | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    return () => {
      if (draftImagePreview) URL.revokeObjectURL(draftImagePreview);
    };
  }, [draftImagePreview]);

  const totalPages = Math.max(1, Math.ceil(pages.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = pages.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setDraftImageFile(null);
    if (draftImagePreview) URL.revokeObjectURL(draftImagePreview);
    setDraftImagePreview("");
  }

  function selectImage(file: File) {
    setError("");
    if (draftImagePreview) URL.revokeObjectURL(draftImagePreview);
    setDraftImageFile(file);
    setDraftImagePreview(URL.createObjectURL(file));
  }

  async function uploadImage(file: File) {
    setIsUploading(true);
    try {
      const compressed = await resizeToWebp(file, 1400, 0.82);
      const formData = new FormData();
      formData.set("slug", form.slug || slugify(form.title) || "page");
      formData.set("image", compressed);

      const response = await fetch("/api/admin/custom-pages/image", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json().catch(() => null)) as { imageUrl?: string; storagePath?: string; error?: string } | null;

      if (!response.ok || !result?.imageUrl) {
        throw new Error(result?.error ?? "Unable to upload image.");
      }

      return result.imageUrl;
    } catch (uploadError) {
      throw new Error(uploadError instanceof Error ? uploadError.message : "Unable to upload image.");
    } finally {
      setIsUploading(false);
    }
  }

  function openEdit(p: CustomPageRow) {
    setForm({
      title: p.title,
      slug: p.slug,
      content: p.content,
      metaDescription: p.meta_description,
      image: p.image || "",
      category: p.category || "page",
      status: p.status,
      hasEditedSlug: true,
    });
    setEditingId(p.id);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    let uploadedImagePath = "";
    let nextImage = form.image;
    if (draftImageFile) {
      try {
        nextImage = await uploadImage(draftImageFile);
        uploadedImagePath = nextImage;
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
        setIsSaving(false);
        return;
      }
    }

    const body = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      content: form.content,
      metaDescription: form.metaDescription,
      image: nextImage,
      category: form.category,
      status: form.status,
    };

    try {
      const url = editingId ? `/api/admin/custom-pages/${editingId}` : "/api/admin/custom-pages";
      const method = editingId ? "PATCH" : "POST";
      const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        if (uploadedImagePath) void cleanupUploadedMedia([uploadedImagePath]);
        setError(result?.error ?? "Failed to save.");
        return;
      }

      if (editingId) {
        setPages((prev) => prev.map((p) => (p.id === editingId ? result.page : p)));
      } else {
        setPages((prev) => [result.page, ...prev]);
      }
      if (draftImagePreview) URL.revokeObjectURL(draftImagePreview);
      setIsModalOpen(false);
      resetForm();
    } catch {
      if (uploadedImagePath) void cleanupUploadedMedia([uploadedImagePath]);
      setError("Network error.");
    }
    finally { setIsSaving(false); }
  }

  async function handleDelete(p: CustomPageRow) {
    if (deletingId) return;
    setDeletingId(p.id);
    try {
      const response = await fetch(`/api/admin/custom-pages/${p.id}`, { method: "DELETE" });
      const result = await response.json().catch(() => null);
      if (!response.ok) { setError(result?.error ?? "Failed to delete."); return; }
      setPages((prev) => prev.filter((x) => x.id !== p.id));
    } catch { setError("Network error."); }
    finally { setDeletingId(null); setPendingDelete(null); }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <AdminPageHeader
        breadcrumbs={[{ label: "Content" }, { label: "Pages", active: true }]}
        title="Custom Pages"
        description="Create and manage pages, blog posts, and guides."
        actions={
          <AdminButton onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <Plus size={16} /> New Page
          </AdminButton>
        }
      />

      <AdminDataTable
        columns={["TITLE", "URL", "IMAGE", "CATEGORY", "STATUS", "CREATED", "ACTIONS"]}
        footer={
          <AdminPagination
            showingFrom={paged.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            showingTo={(currentPage - 1) * pageSize + paged.length}
            total={pages.length}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={() => {}}
          />
        }
      >
        {paged.length === 0 ? (
          <tr><td className="px-6 py-8 text-center text-[var(--ms-text-secondary)]" colSpan={7}>No pages yet.</td></tr>
        ) : (
          paged.map((p) => {
            const meta = categoryMeta[p.category as keyof typeof categoryMeta] || categoryMeta.page;
            return (
              <tr key={p.id} className="transition-colors hover:bg-[#111827]">
                <td className="px-6 py-4">
                  <p className="text-white font-medium">{p.title}</p>
                  {p.meta_description && <p className="text-xs text-[#64748B] truncate max-w-[250px]">{p.meta_description}</p>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[#94A3B8] text-sm">{getPageRoutePrefix(p.category)}/{p.slug}</span>
                    <a href={`${getPageRoutePrefix(p.category)}/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-[#64748B] hover:text-[#22D3EE]">
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {p.image ? (
                    <img src={p.image} alt="" className="h-10 w-16 rounded object-cover" />
                  ) : (
                    <span className="text-[#64748B]"><ImageIcon size={16} /></span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-sm text-[#94A3B8]">
                    <meta.icon size={14} />
                    {meta.label}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${p.status === "active" ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}`}>
                    {p.status === "active" ? "Active" : "Draft"}
                  </span>
                </td>
                <td className="px-6 py-4 text-[#94A3B8] text-sm">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(p)} className="admin-action-icon hover:border-[#22D3EE] hover:text-[#22D3EE]" aria-label="Edit">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => setPendingDelete(p)} className="admin-action-icon hover:border-red-500/30 hover:text-red-300" aria-label="Delete"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </AdminDataTable>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-4xl rounded-xl border border-[var(--ms-accent)] bg-[var(--ms-secondary)] p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">{editingId ? "Edit Page" : "New Page"}</h2>
            {error && <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</p>}

            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6 lg:flex-row">
                <div className="flex-1 space-y-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--ms-text-secondary)] mb-3">Category</p>
                    <div className="grid grid-cols-3 gap-3">
                      {(Object.entries(categoryMeta) as [keyof typeof categoryMeta, typeof categoryMeta[keyof typeof categoryMeta]][]).map(([key, meta]) => {
                        const Icon = meta.icon;
                        const isActive = form.category === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setForm((f) => ({ ...f, category: key }));
                            }}
                            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                              isActive
                                ? "border-[#8B5CF6] bg-[#8B5CF6]/10"
                                : "border-[var(--ms-accent)] bg-[var(--ms-primary)] hover:border-[#64748B]"
                            }`}
                          >
                            <Icon size={22} className={isActive ? "text-[#8B5CF6]" : "text-[#64748B]"} />
                            <div>
                              <p className={`text-sm font-bold ${isActive ? "text-white" : "text-[#94A3B8]"}`}>{meta.label}</p>
                              <p className="mt-0.5 text-[10px] text-[#64748B] leading-tight">{meta.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <AdminFormField label="Title">
                    <input className={adminInputClass} value={form.title} onChange={(e) => {
                      const title = e.target.value;
                      setForm((f) => ({ ...f, title, slug: f.hasEditedSlug ? f.slug : slugify(title) }));
                    }} required placeholder="Enter page title..." />
                  </AdminFormField>

                  <AdminFormField label="Slug">
                    <div className="relative">
                      {form.category !== "page" && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#64748B] pointer-events-none">
                          {getCategoryPrefix(form.category)}/
                        </span>
                      )}
                      <input className={adminInputClass}
                        style={{ paddingLeft: form.category !== "page" ? "2.5rem" : "0.75rem" }}
                        value={form.slug}
                        onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value), hasEditedSlug: true }))}
                        required placeholder="my-page-slug" />
                    </div>
                  </AdminFormField>

                  {form.category !== "page" && (
                    <AdminFormField label="Cover Image">
                      <div className="space-y-3">
                        {(draftImagePreview || form.image) && (
                          <img src={draftImagePreview || form.image} alt="" className="h-40 w-full rounded-lg object-cover" />
                        )}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className={adminInputClass}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) selectImage(file);
                            e.target.value = "";
                          }}
                        />
                        <p className="text-xs text-[var(--ms-text-secondary)]">
                          Recommended: 1400 x 900 px landscape artwork. Uploads are compressed to WebP before storage.
                        </p>
                      </div>
                    </AdminFormField>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--ms-text-secondary)]">Content</span>
                      {form.content && (
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, content: "" }))}
                          className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#64748B] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                          <X size={11} />
                          Clear
                        </button>
                      )}
                    </div>
                    <QuillEditor
                      value={form.content}
                      onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                      placeholder="Write your content here..."
                    />
                  </div>

                  <AdminFormField label="Meta Description">
                    <input className={adminInputClass} value={form.metaDescription}
                      onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))}
                      placeholder="Brief description for SEO..." />
                  </AdminFormField>


                  <div className="flex items-center gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--ms-text-secondary)]">Status</p>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" className="peer sr-only" checked={form.status === "active"}
                        onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked ? "active" : "draft" }))} />
                      <div className="h-6 w-11 rounded-full border border-[var(--ms-accent)] bg-[var(--ms-primary)] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-[#64748B] after:transition-all peer-checked:border-[#8B5CF6] peer-checked:bg-[#8B5CF6]/20 peer-checked:after:translate-x-full peer-checked:after:bg-[#8B5CF6]" />
                      <span className="ml-3 text-sm text-[#94A3B8]">{form.status === "active" ? "Active" : "Draft"}</span>
                    </label>
                  </div>
                </div>

                <div className="w-full lg:w-80 shrink-0">
                  <div className="sticky top-4 rounded-xl border border-[var(--ms-accent)] bg-[var(--ms-primary)] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Eye size={15} className="text-[#64748B]" />
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--ms-text-secondary)]">Preview</p>
                    </div>

                    <div className="rounded-lg border border-[#172554] bg-[#050816] p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#8B5CF6]/20 text-[10px] font-bold text-[#8B5CF6]">
                          {categoryMeta[form.category].label[0]}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8B5CF6]">{categoryMeta[form.category].label}</span>
                      </div>

                      <p className="text-sm font-bold text-white leading-snug">
                        {form.title || "Untitled"}
                      </p>

                      <div className="mt-3 flex items-center gap-1.5 text-xs text-[#64748B]">
                        <ExternalLink size={12} />
                        <span className="truncate">moonstrike.io{getFullPreviewUrl(form.slug || slugify(form.title), form.category)}</span>
                      </div>

                      {form.metaDescription && (
                        <p className="mt-3 text-xs text-[#64748B] leading-relaxed line-clamp-3">
                          {form.metaDescription}
                        </p>
                      )}

                      <div className="mt-4 border-t border-[#172554] pt-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#64748B]">Status</span>
                          <span className={`font-medium ${form.status === "active" ? "text-green-400" : "text-amber-400"}`}>
                            {form.status === "active" ? "Published" : "Draft"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-[var(--ms-accent)] pt-4">
                <AdminButton type="button" variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>Cancel</AdminButton>
                <AdminButton type="submit" disabled={isSaving || isUploading}>{isUploading ? "Uploading..." : isSaving ? "Saving..." : editingId ? "Save Changes" : "Create Page"}</AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete Page"
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
