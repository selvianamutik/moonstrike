"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays, Plus, Search, Trash2, X } from "lucide-react";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminFormField, adminInputClass, adminSelectClass, adminTextareaClass } from "@/components/admin/AdminFormField";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getAdminSession } from "@/lib/admin/session";

type HeroBannerStatus = "draft" | "active" | "scheduled" | "archived";
type RunLength = "never" | "1d" | "7d" | "30d" | "custom";
type CtaType = "game" | "service" | "custom";

type SearchResult = {
  href: string;
  image?: string;
  meta: string;
  title: string;
  type: "Game" | "Service";
};

type FormState = {
  contentType: "hero_banner" | "benefits_section";
  title: string;
  sortOrder: number;
  description: string;
  image: string;
  thumbnail: string;
  storagePath: string;
  thumbnailPath: string;
  badges: string[];
  ctaLabel: string;
  ctaType: CtaType;
  ctaHref: string;
  ctaTitle: string;
  ctaMeta: string;
  status: HeroBannerStatus;
  startDate: string;
  startTime: string;
  runLength: RunLength;
  endDate: string;
  endTime: string;
};

const emptyForm: FormState = {
  contentType: "hero_banner",
  title: "",
  sortOrder: 0,
  description: "",
  image: "",
  thumbnail: "",
  storagePath: "",
  thumbnailPath: "",
  badges: [],
  ctaLabel: "View Details",
  ctaType: "custom",
  ctaHref: "/games",
  ctaTitle: "",
  ctaMeta: "",
  status: "draft",
  startDate: "",
  startTime: "",
  runLength: "never",
  endDate: "",
  endTime: "",
};

function localDateValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function tomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return localDateValue(date);
}

function toIsoFromParts(dateValue: string, timeValue: string) {
  if (!dateValue) return null;
  const date = new Date(`${dateValue}T${timeValue || "00:00"}`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function addDaysIso(startIso: string | null, days: number) {
  const base = startIso ? new Date(startIso) : new Date();
  if (Number.isNaN(base.getTime())) return null;
  base.setDate(base.getDate() + days);
  return base.toISOString();
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function resizeToWebp(file: File, maxWidth: number, quality: number, filename: string) {
  return new Promise<File>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / image.naturalWidth);
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) { reject(new Error("Canvas unavailable")); return; }
      context.drawImage(image, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Compression failed")); return; }
          resolve(new File([blob], filename, { type: "image/webp" }));
        },
        "image/webp",
        quality,
      );
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    image.src = url;
  });
}

function openDatePicker(input: HTMLInputElement | null) {
  if (!input) return;
  if (typeof input.showPicker === "function") { input.showPicker(); return; }
  input.focus();
}

export default function NewContentPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [draftImageFile, setDraftImageFile] = useState<File | null>(null);
  const [draftImagePreview, setDraftImagePreview] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [badgeDraft, setBadgeDraft] = useState("");
  const startDateInputRef = { current: null as HTMLInputElement | null };

  function selectImage(file: File) {
    if (draftImagePreview) URL.revokeObjectURL(draftImagePreview);
    setDraftImageFile(file);
    setDraftImagePreview(URL.createObjectURL(file));
  }

  function addBadge() {
    const badge = badgeDraft.trim();
    if (!badge) return;
    setForm((current) => {
      if (current.badges.some((b) => b.toLowerCase() === badge.toLowerCase())) return current;
      return { ...current, badges: [...current.badges, badge].slice(0, 5) };
    });
    setBadgeDraft("");
  }

  function removeBadge(badge: string) {
    setForm((current) => ({ ...current, badges: current.badges.filter((b) => b !== badge) }));
  }

  function selectCta(result: SearchResult) {
    setForm((current) => ({
      ...current,
      ctaHref: result.href,
      ctaTitle: result.title,
      ctaMeta: result.meta,
      ctaLabel: current.ctaLabel || `Open ${result.type}`,
    }));
    setSearchQuery(result.title);
    setSearchResults([]);
  }

  function resolvedEndsAt() {
    if (form.runLength === "never") return null;
    if (form.runLength === "custom") return toIsoFromParts(form.endDate, form.endTime || "00:00");
    const days = form.runLength === "1d" ? 1 : form.runLength === "7d" ? 7 : 30;
    return addDaysIso(toIsoFromParts(form.startDate, form.startTime || "00:00"), days);
  }

  async function uploadImage(file: File) {
    const [image, thumbnail] = await Promise.all([
      resizeToWebp(file, 1920, 0.82, "hero-banner.webp"),
      resizeToWebp(file, 640, 0.78, "hero-banner-thumb.webp"),
    ]);
    const formData = new FormData();
    formData.set("slug", slugify(form.title) || "hero-banner");
    formData.set("image", image);
    formData.set("thumbnail", thumbnail);

    const response = await fetch("/api/admin/hero-banners/image", { method: "POST", body: formData });
    const payload = (await response.json().catch(() => null)) as { imageUrl?: string; thumbnailUrl?: string; storagePath?: string; thumbnailPath?: string; error?: string } | null;

    if (!response.ok || !payload?.imageUrl || !payload?.thumbnailUrl) {
      throw new Error(payload?.error ?? "Image upload failed.");
    }
    return payload;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    let nextImage = form.image;
    let nextThumbnail = form.thumbnail;
    let nextStoragePath = form.storagePath;
    let nextThumbnailPath = form.thumbnailPath;

    try {
      if (draftImageFile) {
        const uploaded = await uploadImage(draftImageFile);
        nextImage = uploaded.imageUrl ?? "";
        nextThumbnail = uploaded.thumbnailUrl ?? "";
        nextStoragePath = uploaded.storagePath ?? "";
        nextThumbnailPath = uploaded.thumbnailPath ?? "";
      }

      const startsAt = form.status === "scheduled" ? toIsoFromParts(form.startDate, form.startTime || "00:00") : null;
      const endsAt = resolvedEndsAt();

      const body = {
        contentType: form.contentType,
        title: form.title,
        sortOrder: form.sortOrder,
        description: form.description,
        image: nextImage,
        thumbnail: nextThumbnail,
        storagePath: nextStoragePath,
        thumbnailPath: nextThumbnailPath,
        badges: form.badges,
        ctaLabel: form.ctaLabel,
        ctaType: form.ctaType,
        ctaHref: form.ctaHref,
        ctaTitle: form.ctaTitle,
        ctaMeta: form.ctaMeta,
        status: form.status,
        startsAt,
        endsAt,
      };

      const response = await fetch("/api/admin/hero-banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to create content.");
      }

      router.push("/admin/content");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={[
          { label: "Management", href: "/admin" },
          { label: "Content", href: "/admin/content" },
          { label: "New", active: true },
        ]}
        title="Add Content"
        description="Create a new hero banner or edit the Benefits section."
      />

      <form className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6 flex flex-col gap-5" onSubmit={handleSubmit}>
        <AdminFormField label="Content type">
          <select
            className={adminSelectClass}
            value={form.contentType}
            onChange={(event) => setForm((current) => ({ ...current, contentType: event.target.value as FormState["contentType"] }))}
          >
            <option value="hero_banner">Hero banner</option>
            <option value="benefits_section">Benefits section</option>
          </select>
        </AdminFormField>

        {form.contentType === "hero_banner" ? (
          <>
            <AdminFormField label="Title">
              <input className={adminInputClass} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
            </AdminFormField>

            <AdminFormField label="Sort order">
              <input
                type="number"
                className={adminInputClass}
                value={form.sortOrder}
                min={0}
                onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
              />
            </AdminFormField>

            <AdminFormField label="Banner image">
              <div className="space-y-3">
                {draftImagePreview && <img src={draftImagePreview} alt="" className="h-40 w-full rounded-lg object-cover" />}
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
                <p className="text-xs text-[var(--ms-text-secondary)]">Recommended: 1920 x 720 px or wider. Compressed to WebP automatically.</p>
              </div>
            </AdminFormField>

            <AdminFormField label="Badges">
              <div className="flex gap-2">
                <input
                  className={adminInputClass}
                  value={badgeDraft}
                  onChange={(event) => setBadgeDraft(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addBadge(); } }}
                  placeholder="New Season"
                />
                <button type="button" onClick={addBadge} className="admin-action-button rounded-lg border border-[var(--ms-accent)] px-4 text-sm text-white hover:bg-white/5">
                  <Plus size={16} />
                  Add
                </button>
              </div>
              {form.badges.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.badges.map((badge) => (
                    <button
                      key={badge}
                      type="button"
                      onClick={() => removeBadge(badge)}
                      className="inline-flex items-center gap-2 rounded border border-[#8B5CF6]/30 px-2.5 py-1 text-xs uppercase text-[#C4B5FD] hover:border-red-400 hover:text-red-300"
                    >
                      {badge} <X size={12} />
                    </button>
                  ))}
                </div>
              ) : <p className="text-xs text-[var(--ms-text-secondary)] mt-2">Optional. Up to 5 badges.</p>}
            </AdminFormField>

            <AdminFormField label="Description">
              <textarea className={adminTextareaClass} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} required />
            </AdminFormField>

            <AdminFormField label="CTA label">
              <input className={adminInputClass} value={form.ctaLabel} onChange={(event) => setForm((current) => ({ ...current, ctaLabel: event.target.value }))} required />
            </AdminFormField>
            <AdminFormField label="CTA type">
              <select className={adminSelectClass} value={form.ctaType} onChange={(event) => setForm((current) => ({ ...current, ctaType: event.target.value as CtaType, ctaHref: event.target.value === "custom" ? current.ctaHref : "", ctaTitle: "", ctaMeta: "" }))}>
                <option value="game">Game</option>
                <option value="service">Service</option>
                <option value="custom">Custom URL</option>
              </select>
            </AdminFormField>

            {form.ctaType === "custom" ? (
              <AdminFormField label="CTA URL" className="lg:col-span-2">
                <input className={adminInputClass} value={form.ctaHref} onChange={(event) => setForm((current) => ({ ...current, ctaHref: event.target.value }))} required />
              </AdminFormField>
            ) : (
              <AdminFormField label={`Search ${form.ctaType}`} className="lg:col-span-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 text-[var(--admin-muted)]" size={16} />
                  <input className={`${adminInputClass} pl-10`} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={`Search existing ${form.ctaType}...`} />
                </div>
                {form.ctaTitle ? <p className="mt-2 text-xs text-green-400">Selected: {form.ctaTitle} {form.ctaMeta ? `/${form.ctaMeta}` : ""}</p> : null}
                <div className="mt-2 grid gap-2">
                  {isSearching ? <p className="text-xs text-[var(--admin-muted)]">Searching...</p> : null}
                  {searchResults.map((result) => (
                    <button key={`${result.type}-${result.href}`} type="button" onClick={() => selectCta(result)} className="flex items-center gap-3 rounded-lg border border-[var(--admin-border)] p-3 text-left transition-colors hover:border-[var(--admin-accent)]">
                      {result.image ? <img src={result.image} alt="" className="h-10 w-14 rounded object-cover" /> : <div className="h-10 w-14 rounded bg-[var(--admin-border)]" />}
                      <span>
                        <span className="block text-sm font-medium text-white">{result.title}</span>
                        <span className="block text-xs text-[var(--admin-muted)]">{result.meta}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </AdminFormField>
            )}

            <AdminFormField label="Status">
              <select
                className={adminSelectClass}
                value={form.status}
                onChange={(event) => setForm((current) => {
                  const status = event.target.value as HeroBannerStatus;
                  return { ...current, status, startDate: status === "scheduled" && !current.startDate ? tomorrowDate() : current.startDate };
                })}
              >
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="scheduled">scheduled</option>
                <option value="archived">archived</option>
              </select>
            </AdminFormField>

            <AdminFormField label="Show for">
              <select className={adminSelectClass} value={form.runLength} onChange={(event) => setForm((current) => ({ ...current, runLength: event.target.value as RunLength }))}>
                <option value="never">Never expires</option>
                <option value="1d">1 day</option>
                <option value="7d">7 days</option>
                <option value="30d">30 days</option>
                <option value="custom">Custom end date</option>
              </select>
            </AdminFormField>

            {form.status === "scheduled" ? (
              <AdminFormField label="Start showing">
                <div className="flex w-full max-w-xs items-center gap-2 rounded-lg border border-[var(--ms-accent)] bg-[var(--ms-bg-card)] px-3 py-2 text-sm text-white focus-within:border-[var(--ms-gradient-start)]">
                  <button type="button" onClick={() => openDatePicker(startDateInputRef.current)} className="text-[var(--admin-muted)] hover:text-white">
                    <CalendarDays size={16} />
                  </button>
                  <input
                    ref={startDateInputRef}
                    type="datetime-local"
                    className="min-w-0 flex-1 cursor-pointer bg-transparent text-sm text-white outline-none [color-scheme:dark]"
                    value={`${form.startDate}T${form.startTime || "00:00"}`}
                    onChange={(event) => {
                      const [date, time] = event.target.value.split("T");
                      setForm((current) => ({ ...current, startDate: date, startTime: time }));
                    }}
                    required
                  />
                </div>
              </AdminFormField>
            ) : null}

            {form.runLength === "custom" ? (
              <AdminFormField label="End showing">
                <div className="flex w-full max-w-xs items-center gap-2 rounded-lg border border-[var(--ms-accent)] bg-[var(--ms-bg-card)] px-3 py-2 text-sm text-white focus-within:border-[var(--ms-gradient-start)]">
                  <CalendarDays size={16} className="text-[var(--admin-muted)]" />
                  <input
                    type="datetime-local"
                    className="min-w-0 flex-1 cursor-pointer bg-transparent text-sm text-white outline-none [color-scheme:dark]"
                    value={`${form.endDate}T${form.endTime || "00:00"}`}
                    onChange={(event) => {
                      const [date, time] = event.target.value.split("T");
                      setForm((current) => ({ ...current, endDate: date, endTime: time }));
                    }}
                  />
                </div>
              </AdminFormField>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-[var(--ms-text-secondary)]">
            The Benefits section is a single-instance landing block.{" "}
            <a href="/admin/content/why-choose-us/edit" className="text-[var(--ms-gradient-end)] underline">
              Edit the existing Benefits section
            </a>{" "}
            instead of creating a duplicate.
          </p>
        )}

        {error ? <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p> : null}

        <div className="flex gap-3">
          <AdminButton type="submit" disabled={isSaving}>
            {isSaving ? "Creating..." : "Create Content"}
          </AdminButton>
          <a href="/admin/content" className="admin-action-button rounded-lg border border-[var(--ms-accent)] px-4 py-2 text-sm text-[var(--ms-text-secondary)] hover:text-white">
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
