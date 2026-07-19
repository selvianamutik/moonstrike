"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, Search, X } from "lucide-react";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminFormField, adminInputClass, adminSelectClass, adminTextareaClass } from "@/components/admin/AdminFormField";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { HeroBannerRow, HeroBannerStatus } from "@/lib/cms/hero-banners";

type CtaType = "game" | "service" | "custom";
type RunLength = "never" | "1d" | "7d" | "30d" | "custom";

type SearchResult = {
  href: string;
  image?: string;
  meta: string;
  title: string;
  type: "Game" | "Service";
};

type FormState = {
  slug: string;
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

function localDateValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
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

function toLocalParts(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function datePart(value: string | null) {
  return toLocalParts(value).slice(0, 10);
}

function tomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return localDateValue(date);
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
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas unavailable")); return; }
      ctx.drawImage(image, 0, 0, width, height);
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

export default function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [bannerId, setBannerId] = useState<string | null>(null);
  const [banner, setBanner] = useState<HeroBannerRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [draftImageFile, setDraftImageFile] = useState<File | null>(null);
  const [draftImagePreview, setDraftImagePreview] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [badgeDraft, setBadgeDraft] = useState("");

  useEffect(() => {
    params.then(({ id }) => setBannerId(id));
  }, [params]);

  useEffect(() => {
    if (!bannerId) return;
    fetch(`/api/admin/hero-banners/${bannerId}`)
      .then((r) => r.json())
      .then((data: HeroBannerRow) => {
        setBanner(data);
        setForm({
          slug: data.slug,
          title: data.title,
          sortOrder: data.sort_order ?? 0,
          description: data.description,
          image: data.image,
          thumbnail: data.thumbnail,
          storagePath: data.storage_path,
          thumbnailPath: data.thumbnail_path,
          badges: data.badges,
          ctaLabel: data.cta_label,
          ctaType: data.cta_type as CtaType,
          ctaHref: data.cta_href,
          ctaTitle: data.cta_title,
          ctaMeta: data.cta_meta,
          status: data.status,
          startDate: datePart(data.starts_at),
          startTime: data.starts_at ? toLocalParts(data.starts_at).slice(11, 16) : "",
          runLength: data.ends_at ? "custom" : "never",
          endDate: datePart(data.ends_at),
          endTime: data.ends_at ? toLocalParts(data.ends_at).slice(11, 16) : "",
        });
        setSearchQuery(data.cta_title);
        setDraftImagePreview(data.thumbnail || data.image);
        setLoading(false);
      })
      .catch(() => router.push("/admin/content"));
  }, [bannerId, router]);

  useEffect(() => {
    if (!form || form.ctaType === "custom" || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`, { cache: "no-store" }).catch(() => null);
      const payload = (await response?.json().catch(() => null)) as { games?: SearchResult[]; services?: SearchResult[] } | null;
      if (!cancelled) {
        setSearchResults(form.ctaType === "game" ? payload?.games ?? [] : payload?.services ?? []);
        setIsSearching(false);
      }
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timeoutId); };
  }, [form?.ctaType, form?.ctaType, searchQuery]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <AdminPageHeader breadcrumbs={[{ label: "Management", href: "/admin" }, { label: "Content", href: "/admin/content" }, { label: "Loading...", active: true }]} title="Edit Banner" />
        <div className="animate-pulse h-48 rounded-xl bg-[var(--admin-border)]" />
      </div>
    );
  }

  const form0 = form!;

  function selectImage(file: File) {
    if (draftImagePreview) URL.revokeObjectURL(draftImagePreview);
    setDraftImageFile(file);
    setDraftImagePreview(URL.createObjectURL(file));
  }

  function addBadge() {
    const badge = badgeDraft.trim();
    if (!badge) return;
    setForm((current) => {
      if (!current) return current;
      if (current.badges.some((b) => b.toLowerCase() === badge.toLowerCase())) return current;
      return { ...current, badges: [...current.badges, badge].slice(0, 5) };
    });
    setBadgeDraft("");
  }

  function removeBadge(badge: string) {
    setForm((current) => {
      if (!current) return current;
      return { ...current, badges: current.badges.filter((b) => b !== badge) };
    });
  }

  function selectCta(result: SearchResult) {
    setForm((current) => {
      if (!current) return current;
      return { ...current, ctaHref: result.href, ctaTitle: result.title, ctaMeta: result.meta, ctaLabel: current.ctaLabel || `Open ${result.type}` };
    });
    setSearchQuery(result.title);
    setSearchResults([]);
  }

  function resolvedEndsAt() {
    if (form0.runLength === "never") return null;
    if (form0.runLength === "custom") return toIsoFromParts(form0.endDate, form0.endTime || "00:00");
    const days = form0.runLength === "1d" ? 1 : form0.runLength === "7d" ? 7 : 30;
    return addDaysIso(toIsoFromParts(form0.startDate, form0.startTime || "00:00"), days);
  }

  async function uploadImage(file: File) {
    const [image, thumbnail] = await Promise.all([
      resizeToWebp(file, 1920, 0.82, "hero-banner.webp"),
      resizeToWebp(file, 640, 0.78, "hero-banner-thumb.webp"),
    ]);
    const formData = new FormData();
    formData.set("slug", form0.slug || slugify(form0.title) || "hero-banner");
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
    let nextImage = form0.image;
    let nextThumbnail = form0.thumbnail;
    let nextStoragePath = form0.storagePath;
    let nextThumbnailPath = form0.thumbnailPath;
    try {
      if (draftImageFile) {
        const uploaded = await uploadImage(draftImageFile);
        nextImage = uploaded.imageUrl ?? "";
        nextThumbnail = uploaded.thumbnailUrl ?? "";
        nextStoragePath = uploaded.storagePath ?? "";
        nextThumbnailPath = uploaded.thumbnailPath ?? "";
      }
      const startsAt = form0.status === "scheduled" ? toIsoFromParts(form0.startDate, form0.startTime || "00:00") : null;
      const endsAt = resolvedEndsAt();
      const response = await fetch(`/api/admin/hero-banners/${bannerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: form0.slug || undefined,
          title: form0.title,
          description: form0.description,
          image: nextImage,
          thumbnail: nextThumbnail,
          storagePath: nextStoragePath,
          thumbnailPath: nextThumbnailPath,
          badges: form0.badges,
          ctaLabel: form0.ctaLabel,
          ctaType: form0.ctaType,
          ctaHref: form0.ctaHref,
          ctaTitle: form0.ctaTitle,
          ctaMeta: form0.ctaMeta,
          status: form0.status,
          sortOrder: form0.sortOrder,
          startsAt,
          endsAt,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "Save failed.");
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
          { label: banner?.title ?? "Edit Banner", active: true },
        ]}
        title="Edit Banner"
        description={banner?.title}
      />

      <form className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6 flex flex-col gap-5" onSubmit={handleSubmit}>
        <AdminFormField label="Slug">
          <input
            className={adminInputClass}
            value={form0.slug}
            onChange={(e) => setForm((c) => c ? { ...c, slug: slugify(e.target.value) } : c)}
            placeholder="auto-generated-from-title"
          />
          <p className="text-xs text-[var(--ms-text-secondary)] mt-1">URL-safe, auto-generated from title if left blank.</p>
        </AdminFormField>

        <AdminFormField label="Title">
          <input className={adminInputClass} value={form0.title} onChange={(e) => setForm((c) => c ? { ...c, title: e.target.value } : c)} required />
        </AdminFormField>

        <AdminFormField label="Sort order">
          <input type="number" className={adminInputClass} value={form0.sortOrder} min={0} onChange={(e) => setForm((c) => c ? { ...c, sortOrder: Number(e.target.value) } : c)} />
        </AdminFormField>

        <AdminFormField label="Banner image">
          <div className="space-y-3">
            {draftImagePreview && <img src={draftImagePreview} alt="" className="h-40 w-full rounded-lg object-cover" />}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className={adminInputClass}
              onChange={(e) => { const file = e.target.files?.[0]; if (file) selectImage(file); e.target.value = ""; }}
            />
            <p className="text-xs text-[var(--ms-text-secondary)]">Recommended: 1920 x 720 px or wider. Compressed to WebP automatically.</p>
          </div>
        </AdminFormField>

        <AdminFormField label="Badges">
          <div className="flex gap-2">
            <input
              className={adminInputClass}
              value={badgeDraft}
              onChange={(e) => setBadgeDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addBadge(); } }}
              placeholder="New Season"
            />
            <button type="button" onClick={addBadge} className="admin-action-button rounded-lg border border-[var(--ms-accent)] px-4 text-sm text-white hover:bg-white/5">
              <X size={16} />
              Add
            </button>
          </div>
          {form0.badges.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-2">
              {form0.badges.map((badge) => (
                <button key={badge} type="button" onClick={() => removeBadge(badge)} className="inline-flex items-center gap-2 rounded border border-[#8B5CF6]/30 px-2.5 py-1 text-xs uppercase text-[#C4B5FD] hover:border-red-400 hover:text-red-300">
                  {badge} <X size={12} />
                </button>
              ))}
            </div>
          ) : <p className="text-xs text-[var(--ms-text-secondary)] mt-2">Optional. Up to 5 badges.</p>}
        </AdminFormField>

        <AdminFormField label="Description">
          <textarea className={adminTextareaClass} value={form0.description} onChange={(e) => setForm((c) => c ? { ...c, description: e.target.value } : c)} required />
        </AdminFormField>

        <AdminFormField label="CTA label">
          <input className={adminInputClass} value={form0.ctaLabel} onChange={(e) => setForm((c) => c ? { ...c, ctaLabel: e.target.value } : c)} required />
        </AdminFormField>
        <AdminFormField label="CTA type">
          <select className={adminSelectClass} value={form0.ctaType} onChange={(e) => setForm((c) => c ? { ...c, ctaType: e.target.value as CtaType, ctaHref: e.target.value === "custom" ? c.ctaHref : "", ctaTitle: "", ctaMeta: "" } : c)}>
            <option value="game">Game</option>
            <option value="service">Service</option>
            <option value="custom">Custom URL</option>
          </select>
        </AdminFormField>

        {form0.ctaType === "custom" ? (
          <AdminFormField label="CTA URL">
            <input className={adminInputClass} value={form0.ctaHref} onChange={(e) => setForm((c) => c ? { ...c, ctaHref: e.target.value } : c)} required />
          </AdminFormField>
        ) : (
          <AdminFormField label={`Search ${form0.ctaType}`}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 text-[var(--admin-muted)]" size={16} />
              <input className={`${adminInputClass} pl-10`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={`Search existing ${form0.ctaType}...`} />
            </div>
            {form0.ctaTitle ? <p className="mt-2 text-xs text-green-400">Selected: {form0.ctaTitle} {form0.ctaMeta ? `/${form0.ctaMeta}` : ""}</p> : null}
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
          <select className={adminSelectClass} value={form0.status} onChange={(e) => setForm((c) => c ? { ...c, status: e.target.value as HeroBannerStatus, startDate: e.target.value === "scheduled" && !c.startDate ? tomorrowDate() : c.startDate } : c)}>
            <option value="draft">draft</option>
            <option value="active">active</option>
            <option value="scheduled">scheduled</option>
            <option value="archived">archived</option>
          </select>
        </AdminFormField>

        <AdminFormField label="Show for">
          <select className={adminSelectClass} value={form0.runLength} onChange={(e) => setForm((c) => c ? { ...c, runLength: e.target.value as RunLength } : c)}>
            <option value="never">Never expires</option>
            <option value="1d">1 day</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="custom">Custom end date</option>
          </select>
        </AdminFormField>

        {form0.status === "scheduled" ? (
          <AdminFormField label="Start showing">
            <div className="flex w-full max-w-xs items-center gap-2 rounded-lg border border-[var(--ms-accent)] bg-[var(--ms-bg-card)] px-3 py-2 text-sm text-white focus-within:border-[var(--ms-gradient-start)]">
              <button type="button" onClick={() => { const input = document.querySelector<HTMLInputElement>('[aria-label="Start showing date"]'); if (input) input.showPicker?.() ?? input.focus(); }} className="text-[var(--admin-muted)] hover:text-white">
                <CalendarDays size={16} />
              </button>
              <input
                type="datetime-local"
                aria-label="Start showing date"
                className="min-w-0 flex-1 cursor-pointer bg-transparent text-sm text-white outline-none [color-scheme:dark]"
                value={`${form0.startDate}T${form0.startTime || "00:00"}`}
                onChange={(e) => {
                  const [date, time] = e.target.value.split("T");
                  setForm((c) => c ? { ...c, startDate: date, startTime: time } : c);
                }}
                required
              />
            </div>
          </AdminFormField>
        ) : null}

        {form0.runLength === "custom" ? (
          <AdminFormField label="End showing">
            <div className="flex w-full max-w-xs items-center gap-2 rounded-lg border border-[var(--ms-accent)] bg-[var(--ms-bg-card)] px-3 py-2 text-sm text-white focus-within:border-[var(--ms-gradient-start)]">
              <CalendarDays size={16} className="text-[var(--admin-muted)]" />
              <input
                type="datetime-local"
                className="min-w-0 flex-1 cursor-pointer bg-transparent text-sm text-white outline-none [color-scheme:dark]"
                value={`${form0.endDate}T${form0.endTime || "00:00"}`}
                onChange={(e) => {
                  const [date, time] = e.target.value.split("T");
                  setForm((c) => c ? { ...c, endDate: date, endTime: time } : c);
                }}
              />
            </div>
          </AdminFormField>
        ) : null}

        {error ? <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p> : null}

        <div className="flex gap-3">
          <AdminButton type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Changes"}</AdminButton>
          <a href="/admin/content" className="admin-action-button rounded-lg border border-[var(--ms-accent)] px-4 py-2 text-sm text-[var(--ms-text-secondary)] hover:text-white">Cancel</a>
        </div>
      </form>
    </div>
  );
}
