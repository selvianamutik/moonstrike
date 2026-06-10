"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminFormField, adminInputClass, adminSelectClass, adminTextareaClass } from "@/components/admin/AdminFormField";
import { GAME_PLATFORMS } from "@/lib/admin-constants";
import { cleanupUploadedMedia } from "@/lib/cms/client-media-cleanup";
import type { GenreRow } from "@/lib/cms/genres";
import type { GameRow } from "@/lib/cms/games";

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

        resolve(new File([blob], "game-image.webp", { type: "image/webp" }));
      },
      "image/webp",
      quality
    );
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function GameForm({ game, genres }: { game?: GameRow; genres: GenreRow[] }) {
  const router = useRouter();
  const isEditing = Boolean(game);
  const [name, setName] = useState(game?.name ?? "");
  const [slug, setSlug] = useState(game?.slug ?? "");
  const [genreId, setGenreId] = useState(game?.genre_id ?? genres[0]?.id ?? "");
  const [platform, setPlatform] = useState(game?.platforms[0] ?? GAME_PLATFORMS[0]);
  const [description, setDescription] = useState(game?.description ?? "");
  const [image, setImage] = useState(game?.image ?? "");
  const [status, setStatus] = useState(game?.status ?? "active");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingImagePath, setPendingImagePath] = useState("");

  async function uploadImage(file: File) {
    setError("");
    setIsUploading(true);

    try {
      const compressed = await resizeToWebp(file, 1200, 0.82);
      const formData = new FormData();
      formData.set("slug", slug || slugify(name) || "game");
      formData.set("image", compressed);

      const response = await fetch("/api/admin/games/image", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json().catch(() => null)) as {
        imageUrl?: string;
        storagePath?: string;
        error?: string;
      } | null;

      if (!response.ok || !result?.imageUrl) {
        setError(result?.error ?? "Unable to upload game image.");
        return;
      }

      if (pendingImagePath) {
        void cleanupUploadedMedia([pendingImagePath]);
      }

      setImage(result.imageUrl);
      setPendingImagePath(result.storagePath ?? "");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload game image.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(isEditing ? `/api/admin/games/${game?.id}` : "/api/admin/games", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          genreId,
          platform,
          description,
          image,
          status,
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(result?.error ?? "Unable to save game.");
        return;
      }

      setPendingImagePath("");
      router.push("/admin/games");
      router.refresh();
    } catch {
      setError("Unable to reach the games CMS endpoint.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Games", href: "/admin/games" }, { label: isEditing ? "Edit" : "New", active: true }]}
        title={isEditing ? `Edit: ${game?.name}` : "Add New Game"}
      />
      <form
        className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6 flex flex-col gap-5"
        onSubmit={handleSubmit}
      >
        <AdminFormField label="Game Name">
          <input
            className={adminInputClass}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!isEditing) setSlug(slugify(e.target.value));
            }}
            required
          />
        </AdminFormField>
        <AdminFormField label="Slug">
          <input className={adminInputClass + (isEditing ? " opacity-60" : "")} value={slug} onChange={(e) => setSlug(slugify(e.target.value))} readOnly={isEditing} required />
        </AdminFormField>
        <AdminFormField label="Genre / Type">
          <select className={adminSelectClass} value={genreId} onChange={(e) => setGenreId(e.target.value)} required>
            {genres.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </AdminFormField>
        <AdminFormField label="Platform">
          <select className={adminSelectClass} value={platform} onChange={(e) => setPlatform(e.target.value)}>
            {GAME_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </AdminFormField>
        <AdminFormField label="Description">
          <textarea className={adminTextareaClass} value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </AdminFormField>
        <AdminFormField label="Game image">
          <div className="space-y-3">
            {image && <img src={image} alt="" className="h-32 w-full rounded-lg object-cover" />}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className={adminInputClass}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file);
              }}
            />
            <p className="text-xs text-[var(--ms-text-secondary)]">
              Recommended: 1200 x 800 px (3:2). Uploads are compressed to WebP before storage.
            </p>
          </div>
        </AdminFormField>
        <AdminFormField label="Status">
          <select className={adminSelectClass} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="active">active</option>
            <option value="draft">draft</option>
            <option value="archived">archived</option>
          </select>
        </AdminFormField>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <AdminButton type="submit" disabled={isSaving || isUploading}>
            {isUploading ? "Uploading..." : isSaving ? "Saving..." : "Save Game"}
          </AdminButton>
          <AdminButton
            type="button"
            variant="secondary"
            onClick={() => {
              if (pendingImagePath) void cleanupUploadedMedia([pendingImagePath]);
              router.push("/admin/games");
            }}
          >
            Cancel
          </AdminButton>
        </div>
      </form>
    </div>
  );
}
