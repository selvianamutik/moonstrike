"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminFormField, adminInputClass, adminSelectClass, adminTextareaClass } from "@/components/admin/AdminFormField";
import { cleanupUploadedMedia } from "@/lib/cms/client-media-cleanup";
import {
  normalizeLandingBenefitsData,
  normalizeLandingHeroData,
  type ContentBlockRow,
  type LandingBenefitItem,
} from "@/lib/cms/landing";

type UploadedImage = {
  imageUrl: string;
  thumbnailUrl: string;
  storagePath: string;
  thumbnailPath: string;
};

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
  const isHero = content.type === "hero";
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
  const [status, setStatus] = useState(content.status);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingHeroPaths, setPendingHeroPaths] = useState<string[]>([]);
  const [pendingBenefitsPaths, setPendingBenefitsPaths] = useState<string[]>([]);

  function updateBenefit(index: number, field: keyof LandingBenefitItem, value: string) {
    setBenefitItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  }

  async function uploadImage(file: File, usage: "hero" | "benefits") {
    setError("");
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
        setError(result?.error ?? "Unable to upload image.");
        return;
      }

      const nextPaths = [result.storagePath, result.thumbnailPath].filter(Boolean);

      if (usage === "hero") {
        if (pendingHeroPaths.length > 0) void cleanupUploadedMedia(pendingHeroPaths);
        setHeroImageUrl(result.imageUrl);
        setHeroThumbnailUrl(result.thumbnailUrl);
        setHeroStoragePath(result.storagePath);
        setHeroThumbnailPath(result.thumbnailPath);
        setPendingHeroPaths(nextPaths);
      } else {
        if (pendingBenefitsPaths.length > 0) void cleanupUploadedMedia(pendingBenefitsPaths);
        setImageUrl(result.imageUrl);
        setThumbnailUrl(result.thumbnailUrl);
        setStoragePath(result.storagePath);
        setThumbnailPath(result.thumbnailPath);
        setPendingBenefitsPaths(nextPaths);
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload image.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    const data = isHero
      ? {
          label,
          headline,
          subtext,
          ctaText,
          ctaHref,
          badgeVariant,
          imageUrl: heroImageUrl,
          thumbnailUrl: heroThumbnailUrl,
          storagePath: heroStoragePath,
          thumbnailPath: heroThumbnailPath,
        }
      : {
          title: benefitsTitle,
          accent: benefitsAccent,
          imageUrl,
          thumbnailUrl,
          storagePath,
          thumbnailPath,
          imageAlt,
          items: benefitItems,
        };

    try {
      const response = await fetch(`/api/admin/content/${content.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, data }),
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(result?.error ?? "Unable to save content.");
        return;
      }

      setPendingHeroPaths([]);
      setPendingBenefitsPaths([]);
      router.push("/admin/content");
      router.refresh();
    } catch {
      setError("Unable to reach the CMS save endpoint.");
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
        title={`Edit: ${isHero ? "Landing Hero" : "Why Choose Us"}`}
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
                {heroThumbnailUrl && <img src={heroThumbnailUrl} alt="" className="h-28 w-full rounded-lg object-cover" />}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className={adminInputClass}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage(file, "hero");
                  }}
                />
                <p className="text-xs text-[var(--ms-text-secondary)]">
                  Recommended: 1920 x 720 px or wider landscape artwork. Uploads are compressed and a thumbnail is generated automatically.
                </p>
              </div>
            </AdminFormField>
          </>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminFormField label="Section title">
                <input className={adminInputClass} value={benefitsTitle} onChange={(e) => setBenefitsTitle(e.target.value)} required />
              </AdminFormField>
              <AdminFormField label="Accent words">
                <input className={adminInputClass} value={benefitsAccent} onChange={(e) => setBenefitsAccent(e.target.value)} required />
              </AdminFormField>
            </div>
            <AdminFormField label="Section image">
              <div className="space-y-3">
                {thumbnailUrl && <img src={thumbnailUrl} alt="" className="h-28 w-full rounded-lg object-cover" />}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className={adminInputClass}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage(file, "benefits");
                  }}
                />
                <p className="text-xs text-[var(--ms-text-secondary)]">
                  Recommended: 1600 x 600 px landscape image. Uploads are compressed and a thumbnail is generated automatically.
                </p>
              </div>
            </AdminFormField>
            <AdminFormField label="Image alt text">
              <input className={adminInputClass} value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} required />
            </AdminFormField>
            {benefitItems.map((item, index) => (
              <div key={index} className="rounded-lg border border-[var(--ms-accent)] p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--ms-text-secondary)]">Benefit {index + 1}</p>
                <div className="grid gap-3 sm:grid-cols-[90px_1fr]">
                  <AdminFormField label="Icon">
                    <input className={adminInputClass} value={item.icon} onChange={(e) => updateBenefit(index, "icon", e.target.value)} maxLength={4} required />
                  </AdminFormField>
                  <AdminFormField label="Title">
                    <input className={adminInputClass} value={item.title} onChange={(e) => updateBenefit(index, "title", e.target.value)} required />
                  </AdminFormField>
                </div>
                <AdminFormField label="Detail">
                  <textarea className={adminTextareaClass} value={item.detail} onChange={(e) => updateBenefit(index, "detail", e.target.value)} rows={3} required />
                </AdminFormField>
              </div>
            ))}
          </>
        )}

        <AdminFormField label="Status">
          <select className={adminSelectClass} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="active">active</option>
            <option value="scheduled">scheduled</option>
            <option value="draft">draft</option>
          </select>
        </AdminFormField>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <p className="text-xs text-[var(--ms-text-secondary)]">
          New images are uploaded immediately. Replaced saved images are removed from Storage after you save this content block.
        </p>

        <div className="flex gap-3">
          <AdminButton type="submit" disabled={isSaving || isUploading}>
            {isUploading ? "Uploading..." : isSaving ? "Saving..." : "Save Content"}
          </AdminButton>
          <AdminButton
            type="button"
            variant="secondary"
            onClick={() => {
              void cleanupUploadedMedia([...pendingHeroPaths, ...pendingBenefitsPaths]);
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
