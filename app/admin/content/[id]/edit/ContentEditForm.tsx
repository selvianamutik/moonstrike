"use client";

import React, { useEffect, useRef, useState } from "react";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminFormField, adminInputClass, adminSelectClass, adminTextareaClass } from "@/components/admin/AdminFormField";
import { cleanupUploadedMedia } from "@/lib/cms/client-media-cleanup";
import {
  normalizeLandingBenefitsData,
  normalizeLandingHeroData,
  normalizeLandingStepsData,
  type ContentBlockRow,
  type LandingBenefitItem,
  type LandingStepsData,
} from "@/lib/cms/landing";

type LocalStepItem = { title: string; description: string };

type UploadedImage = {
  imageUrl: string;
  thumbnailUrl: string;
  storagePath: string;
  thumbnailPath: string;
};

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

function timePart(value: string | null, fallback: string) {
  return toLocalParts(value).slice(11, 16) || fallback;
}

function toIsoFromParts(dateValue: string, timeValue: string) {
  if (!dateValue) return null;
  const date = new Date(`${dateValue}T${timeValue || "09:00"}`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function tomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function loadImage(file: Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read image."));
    };
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
        if (!blob) {
          reject(new Error("Unable to compress image."));
          return;
        }

        resolve(new File([blob], "cms-image.webp", { type: "image/webp" }));
      },
      "image/webp",
      quality
    );
  });
}

export function ContentEditForm({ content }: { content: ContentBlockRow }) {
  const router = useRouter();
  const hero = normalizeLandingHeroData(content.data);
  const benefits = normalizeLandingBenefitsData(content.data);
  const steps = normalizeLandingStepsData(content.data);
  const isHero = content.type === "hero";
  const isSteps = content.type === "steps_section";
  const [label, setLabel] = useState(hero.label);
  const [headline, setHeadline] = useState(hero.headline);
  const [subtext, setSubtext] = useState(hero.subtext);
  const [ctaText, setCtaText] = useState(hero.ctaText);
  const [ctaHref, setCtaHref] = useState(hero.ctaHref);
  const [badgeVariant, setBadgeVariant] = useState(hero.badgeVariant);
  const [heroImageUrl, setHeroImageUrl] = useState(hero.imageUrl);
  const [heroThumbnailUrl, setHeroThumbnailUrl] = useState(hero.thumbnailUrl);
  const [heroStoragePath, setHeroStoragePath] = useState(hero.storagePath);
  const [heroThumbnailPath, setHeroThumbnailPath] = useState(hero.thumbnailPath);
  const [benefitsTitle, setBenefitsTitle] = useState(benefits.title);
  const [benefitsAccent, setBenefitsAccent] = useState(benefits.accent);
  const [imageUrl, setImageUrl] = useState(benefits.imageUrl);
  const [thumbnailUrl, setThumbnailUrl] = useState(benefits.thumbnailUrl);
  const [storagePath, setStoragePath] = useState(benefits.storagePath);
  const [thumbnailPath, setThumbnailPath] = useState(benefits.thumbnailPath);
  const [imageAlt, setImageAlt] = useState(benefits.imageAlt);
  const [benefitItems, setBenefitItems] = useState<LandingBenefitItem[]>(benefits.items);
  const [stepsTitle, setStepsTitle] = useState(steps.title);
  const [stepsAccent, setStepsAccent] = useState(steps.accent);
  const [stepsSubtitle, setStepsSubtitle] = useState(steps.subtitle);
  const [stepItems, setStepItems] = useState(steps.items);
  const [status, setStatus] = useState(content.status);
  const [scheduledDate, setScheduledDate] = useState(datePart(content.scheduled_at));
  const [scheduledTime, setScheduledTime] = useState(timePart(content.scheduled_at, "09:00"));
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [draftHeroImage, setDraftHeroImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const [draftBenefitsImage, setDraftBenefitsImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const scheduledDateInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (draftHeroImage?.previewUrl) URL.revokeObjectURL(draftHeroImage.previewUrl);
    };
  }, [draftHeroImage]);

  useEffect(() => {
    return () => {
      if (draftBenefitsImage?.previewUrl) URL.revokeObjectURL(draftBenefitsImage.previewUrl);
    };
  }, [draftBenefitsImage]);

  function updateBenefit(index: number, field: keyof LandingBenefitItem, value: string) {
    setBenefitItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addBenefit() {
    setBenefitItems((current) => [
      ...current,
      { icon: "MS", title: "", detail: "" },
    ]);
  }

  function removeBenefit(index: number) {
    setBenefitItems((current) => current.filter((_, i) => i !== index));
  }

  function updateStep(index: number, field: keyof LocalStepItem, value: string) {
    setStepItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addStep() {
    setStepItems((current) => [...current, { title: "", description: "" }]);
  }

  function removeStep(index: number) {
    setStepItems((current) => current.filter((_, i) => i !== index));
  }

  function selectImage(file: File, usage: "hero" | "benefits") {
    setError("");
    const previewUrl = URL.createObjectURL(file);

    if (usage === "hero") {
      if (draftHeroImage?.previewUrl) URL.revokeObjectURL(draftHeroImage.previewUrl);
      setDraftHeroImage({ file, previewUrl });
    } else {
      if (draftBenefitsImage?.previewUrl) URL.revokeObjectURL(draftBenefitsImage.previewUrl);
      setDraftBenefitsImage({ file, previewUrl });
    }
  }

  function openDatePicker(input: HTMLInputElement | null) {
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.focus();
  }

  async function uploadImage(file: File, usage: "hero" | "benefits") {
    setIsUploading(true);

    try {
      const [image, thumbnail] = await Promise.all([
        resizeToWebp(file, 1600, 0.82),
        resizeToWebp(file, 420, 0.76),
      ]);
      const formData = new FormData();
      formData.set("usage", usage);
      formData.set("image", image);
      formData.set("thumbnail", thumbnail);

      const response = await fetch(`/api/admin/content/${content.id}/image`, {
        method: "POST",
        body: formData,
      });
      const result = (await response.json().catch(() => null)) as
        | (UploadedImage & { error?: string })
        | null;

      if (!response.ok || !result) {
        throw new Error(result?.error ?? "Unable to upload image.");
      }

      return result;
    } catch (uploadError) {
      throw new Error(uploadError instanceof Error ? uploadError.message : "Unable to upload image.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSaving(true);
    const uploadedPaths: string[] = [];
    let nextHeroImageUrl = heroImageUrl;
    let nextHeroThumbnailUrl = heroThumbnailUrl;
    let nextHeroStoragePath = heroStoragePath;
    let nextHeroThumbnailPath = heroThumbnailPath;
    let nextBenefitsImageUrl = imageUrl;
    let nextBenefitsThumbnailUrl = thumbnailUrl;
    let nextBenefitsStoragePath = storagePath;
    let nextBenefitsThumbnailPath = thumbnailPath;

    try {
      if (isHero && draftHeroImage) {
        const uploadedHero = await uploadImage(draftHeroImage.file, "hero");
        nextHeroImageUrl = uploadedHero.imageUrl;
        nextHeroThumbnailUrl = uploadedHero.thumbnailUrl;
        nextHeroStoragePath = uploadedHero.storagePath;
        nextHeroThumbnailPath = uploadedHero.thumbnailPath;
        uploadedPaths.push(uploadedHero.storagePath, uploadedHero.thumbnailPath);
      }

      if (!isHero && !isSteps && draftBenefitsImage) {
        const uploadedBenefits = await uploadImage(draftBenefitsImage.file, "benefits");
        nextBenefitsImageUrl = uploadedBenefits.imageUrl;
        nextBenefitsThumbnailUrl = uploadedBenefits.thumbnailUrl;
        nextBenefitsStoragePath = uploadedBenefits.storagePath;
        nextBenefitsThumbnailPath = uploadedBenefits.thumbnailPath;
        uploadedPaths.push(uploadedBenefits.storagePath, uploadedBenefits.thumbnailPath);
      }

      const data = isHero
        ? {
            label,
            headline,
            subtext,
            ctaText,
            ctaHref,
            badgeVariant,
            imageUrl: nextHeroImageUrl,
            thumbnailUrl: nextHeroThumbnailUrl,
            storagePath: nextHeroStoragePath,
            thumbnailPath: nextHeroThumbnailPath,
          }
        : isSteps
          ? {
              title: stepsTitle,
              accent: stepsAccent,
              subtitle: stepsSubtitle,
              items: stepItems,
            }
          : {
              title: benefitsTitle,
              accent: benefitsAccent,
              imageUrl: nextBenefitsImageUrl,
              thumbnailUrl: nextBenefitsThumbnailUrl,
              storagePath: nextBenefitsStoragePath,
              thumbnailPath: nextBenefitsThumbnailPath,
              imageAlt,
              items: benefitItems,
            };

      const response = await fetch(`/api/admin/content/${content.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          scheduledAt: status === "scheduled" ? toIsoFromParts(scheduledDate, scheduledTime) : null,
          data,
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        void cleanupUploadedMedia(uploadedPaths);
        setError(result?.error ?? "Unable to save content.");
        return;
      }

      setHeroImageUrl(nextHeroImageUrl);
      setHeroThumbnailUrl(nextHeroThumbnailUrl);
      setHeroStoragePath(nextHeroStoragePath);
      setHeroThumbnailPath(nextHeroThumbnailPath);
      setImageUrl(nextBenefitsImageUrl);
      setThumbnailUrl(nextBenefitsThumbnailUrl);
      setStoragePath(nextBenefitsStoragePath);
      setThumbnailPath(nextBenefitsThumbnailPath);
      if (draftHeroImage?.previewUrl) URL.revokeObjectURL(draftHeroImage.previewUrl);
      if (draftBenefitsImage?.previewUrl) URL.revokeObjectURL(draftBenefitsImage.previewUrl);
      setDraftHeroImage(null);
      setDraftBenefitsImage(null);
      router.push("/admin/content");
      router.refresh();
    } catch (saveError) {
      void cleanupUploadedMedia(uploadedPaths);
      setError(saveError instanceof Error ? saveError.message : "Unable to reach the CMS save endpoint.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={[
          { label: "Management" },
          { label: "Content", href: "/admin/content" },
          { label: "Edit", active: true },
        ]}
        title={`Edit: ${isHero ? "Landing Hero" : isSteps ? "How It Works" : "Why Choose Us"}`}
        description="Images are compressed in-browser, uploaded to Supabase Storage, and thumbnails are generated automatically."
      />
      <form
        className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6 flex flex-col gap-5"
        onSubmit={handleSubmit}
      >
        {isHero ? (
          <>
            <AdminFormField label="Eyebrow label">
              <input className={adminInputClass} value={label} onChange={(e) => setLabel(e.target.value)} />
            </AdminFormField>
            <AdminFormField label="Headline">
              <input className={adminInputClass} value={headline} onChange={(e) => setHeadline(e.target.value)} required />
            </AdminFormField>
            <AdminFormField label="Subtext">
              <textarea className={adminTextareaClass} value={subtext} onChange={(e) => setSubtext(e.target.value)} rows={4} required />
            </AdminFormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminFormField label="CTA text">
                <input className={adminInputClass} value={ctaText} onChange={(e) => setCtaText(e.target.value)} required />
              </AdminFormField>
              <AdminFormField label="CTA link">
                <input className={adminInputClass} value={ctaHref} onChange={(e) => setCtaHref(e.target.value)} required />
              </AdminFormField>
            </div>
            <AdminFormField label="Badge">
              <select className={adminSelectClass} value={badgeVariant} onChange={(e) => setBadgeVariant(e.target.value as typeof badgeVariant)}>
                <option value="new">new</option>
                <option value="featured">featured</option>
                <option value="hot">hot</option>
              </select>
            </AdminFormField>
            <AdminFormField label="Hero banner image">
              <div className="space-y-3">
                {(draftHeroImage?.previewUrl || heroThumbnailUrl) && (
                  <img src={draftHeroImage?.previewUrl || heroThumbnailUrl} alt="" className="h-28 w-full rounded-lg object-cover" />
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className={adminInputClass}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) selectImage(file, "hero");
                    e.target.value = "";
                  }}
                />
                <p className="text-xs text-[var(--ms-text-secondary)]">
                  Recommended: 1920 x 720 px or wider landscape artwork. Uploads are compressed and a thumbnail is generated automatically.
                </p>
              </div>
            </AdminFormField>
          </>
        ) : !isSteps ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminFormField label="Section title">
                <input className={adminInputClass} value={stepsTitle} onChange={(e) => setStepsTitle(e.target.value)} required />
              </AdminFormField>
              <AdminFormField label="Accent words">
                <input className={adminInputClass} value={stepsAccent} onChange={(e) => setStepsAccent(e.target.value)} required />
              </AdminFormField>
            </div>
            <AdminFormField label="Subtitle">
              <input className={adminInputClass} value={stepsSubtitle} onChange={(e) => setStepsSubtitle(e.target.value)} required />
            </AdminFormField>
            {stepItems.map((item, index) => (
              <div key={index} className="rounded-lg border border-[var(--ms-accent)] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--ms-text-secondary)]">Step {index + 1}</p>
                  {stepItems.length > 1 ? (
                    <button type="button" onClick={() => removeStep(index)} className="text-red-400 hover:text-red-300 transition-colors" aria-label={`Remove step ${index + 1}`}>
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                </div>
                <AdminFormField label="Step title">
                  <input className={adminInputClass} value={item.title} onChange={(e) => updateStep(index, "title", e.target.value)} required />
                </AdminFormField>
                <AdminFormField label="Description">
                  <textarea className={adminTextareaClass} value={item.description} onChange={(e) => updateStep(index, "description", e.target.value)} rows={2} required />
                </AdminFormField>
              </div>
            ))}
            <button type="button" onClick={addStep} className="flex items-center gap-2 rounded-lg border border-dashed border-[var(--ms-accent)] px-4 py-3 text-sm text-[var(--ms-text-secondary)] hover:border-[var(--ms-gradient-start)] hover:text-white transition-colors">
              <Plus size={16} />
              Add Step
            </button>
          </>
        ) : null}

        <AdminFormField label="Status">
          <select
            className={adminSelectClass}
            value={status}
            onChange={(e) => {
              const nextStatus = e.target.value as typeof status;
              setStatus(nextStatus);
              if (nextStatus === "scheduled" && !scheduledDate) setScheduledDate(tomorrowDate());
            }}
          >
            <option value="active">active</option>
            <option value="scheduled">scheduled</option>
            <option value="draft">draft</option>
          </select>
        </AdminFormField>

        {status === "scheduled" ? (
          <AdminFormField label="Start showing">
            <div className="flex w-full items-center gap-2 rounded-lg border border-[var(--ms-accent)] bg-[var(--ms-primary)] px-3 py-2 text-sm text-white focus-within:border-[#8B5CF6] focus-within:ring-1 focus-within:ring-[#8B5CF6]">
              <button
                type="button"
                onClick={() => openDatePicker(scheduledDateInputRef.current)}
                className="text-[var(--ms-text-secondary)] transition-colors hover:text-white"
                aria-label="Open content start date picker"
              >
                <CalendarDays size={16} />
              </button>
              <input
                ref={scheduledDateInputRef}
                type="date"
                className="min-w-0 flex-1 cursor-pointer bg-transparent text-sm text-white outline-none [color-scheme:dark]"
                value={scheduledDate}
                onChange={(event) => setScheduledDate(event.target.value)}
                aria-label="Content start date"
                required
              />
              <span className="text-[var(--ms-text-secondary)]">-</span>
              <input
                type="time"
                className="w-[92px] bg-transparent text-sm text-white outline-none"
                value={scheduledTime}
                onChange={(event) => setScheduledTime(event.target.value)}
                aria-label="Content start time"
                step={60}
                required
              />
            </div>
          </AdminFormField>
        ) : null}

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <p className="text-xs text-[var(--ms-text-secondary)]">
          New images are previewed locally and uploaded only when you save. Replaced saved images are removed from Storage after save succeeds.
        </p>

        <div className="flex gap-3">
          <AdminButton type="submit" disabled={isSaving || isUploading}>
            {isUploading ? "Uploading..." : isSaving ? "Saving..." : "Save Content"}
          </AdminButton>
          <AdminButton
            type="button"
            variant="secondary"
            onClick={() => {
              if (draftHeroImage?.previewUrl) URL.revokeObjectURL(draftHeroImage.previewUrl);
              if (draftBenefitsImage?.previewUrl) URL.revokeObjectURL(draftBenefitsImage.previewUrl);
              router.push("/admin/content");
            }}
          >
            Cancel
          </AdminButton>
        </div>
      </form>
    </div>
  );
}
