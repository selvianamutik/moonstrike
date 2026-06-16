"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, LinkIcon, Search, X } from "lucide-react";
import type { ChatAttachment } from "@/lib/chat";

export type ChatComposerAttachment =
  | ChatAttachment
  | {
      type: "draft_image";
      file: File;
      previewUrl: string;
      filename: string;
      sizeBytes: number;
    };

type SearchResult = {
  href: string;
  image?: string;
  meta?: string;
  title: string;
  type: "Game" | "Service";
};

type ChatComposerToolsProps = {
  attachments: ChatComposerAttachment[];
  disabled?: boolean;
  onAttachmentsChange: (attachments: ChatComposerAttachment[]) => void;
  onError: (message: string) => void;
};

const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function isDraftImage(attachment: ChatComposerAttachment): attachment is Extract<ChatComposerAttachment, { type: "draft_image" }> {
  return attachment.type === "draft_image";
}

function revokeDraftImage(attachment: ChatComposerAttachment) {
  if (isDraftImage(attachment)) {
    URL.revokeObjectURL(attachment.previewUrl);
  }
}

export async function deleteChatImageAttachment(attachment: ChatAttachment) {
  if (attachment.type !== "image") return;

  await fetch("/api/chat/attachments/image", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storagePath: attachment.storagePath, url: attachment.url }),
  }).catch(() => null);
}

export async function uploadChatComposerAttachments(attachments: ChatComposerAttachment[]) {
  const uploadedImages: ChatAttachment[] = [];
  const resolved: ChatAttachment[] = [];

  for (const attachment of attachments) {
    if (!isDraftImage(attachment)) {
      resolved.push(attachment);
      continue;
    }

    const formData = new FormData();
    formData.append("image", attachment.file);

    const response = await fetch("/api/chat/attachments/image", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload.attachment) {
      throw new Error(payload.error ?? "Unable to upload image.");
    }

    const uploaded = payload.attachment as ChatAttachment;
    uploadedImages.push(uploaded);
    resolved.push(uploaded);
  }

  return { attachments: resolved, uploadedImages };
}

export function ChatComposerTools({ attachments, disabled = false, onAttachmentsChange, onError }: ChatComposerToolsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingAttachmentsRef = useRef(attachments);
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  function addImage(file: File) {
    onError("");

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      onError("Image must be PNG, JPG, WebP, or GIF.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      onError("Image must be 5MB or smaller.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    onAttachmentsChange([
      ...attachments,
      {
        type: "draft_image",
        file,
        previewUrl: URL.createObjectURL(file),
        filename: file.name,
        sizeBytes: file.size,
      },
    ]);

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeAttachment(index: number) {
    const attachment = attachments[index];
    if (attachment) revokeDraftImage(attachment);
    onAttachmentsChange(attachments.filter((_, itemIndex) => itemIndex !== index));
  }

  async function searchLinks(nextQuery: string) {
    setQuery(nextQuery);
    if (nextQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(nextQuery)}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      const games = Array.isArray(payload.games) ? payload.games : [];
      const services = Array.isArray(payload.services) ? payload.services : [];
      setResults([...games, ...services]);
    } catch {
      onError("Unable to search games and services.");
    } finally {
      setIsSearching(false);
    }
  }

  function addLinkAttachment(result: SearchResult) {
    onAttachmentsChange([
      ...attachments,
      {
        type: "link",
        linkType: result.type === "Game" ? "game" : "service",
        title: result.title,
        href: result.href,
        image: result.image,
        meta: result.meta,
      },
    ]);
    setLinkPickerOpen(false);
    setQuery("");
    setResults([]);
  }

  useEffect(() => {
    const previous = pendingAttachmentsRef.current;
    for (const attachment of previous) {
      if (isDraftImage(attachment) && !attachments.includes(attachment)) {
        revokeDraftImage(attachment);
      }
    }
    pendingAttachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    return () => {
      for (const attachment of pendingAttachmentsRef.current) {
        revokeDraftImage(attachment);
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      {attachments.length > 0 ? (
        <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto rounded-lg border border-white/10 bg-black/10 p-2">
          {attachments.map((attachment, index) => (
            <div key={index} className="flex max-w-full items-center gap-2 rounded-md border border-white/15 bg-black/20 px-2 py-1.5 text-xs">
              {attachment.type === "image" || attachment.type === "draft_image" ? (
                <img src={attachment.type === "draft_image" ? attachment.previewUrl : attachment.url} alt="" className="h-8 w-8 rounded object-cover" />
              ) : attachment.image ? (
                <img src={attachment.image} alt="" className="h-8 w-8 rounded object-cover" />
              ) : (
                <span className="grid h-8 w-8 place-items-center rounded bg-white/10">
                  <LinkIcon size={14} />
                </span>
              )}
              <span className="min-w-0 max-w-[180px] truncate">
                {attachment.type === "image" || attachment.type === "draft_image" ? attachment.filename || "Image" : attachment.title}
              </span>
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="shrink-0 opacity-70 hover:text-[var(--ms-danger)] hover:opacity-100"
                aria-label={`Remove ${attachment.type} attachment`}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {linkPickerOpen ? (
        <div className="max-h-72 overflow-hidden rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="flex items-center gap-2 rounded-md border border-white/10 px-3">
            <Search size={15} className="opacity-60" />
            <input
              value={query}
              onChange={(event) => void searchLinks(event.target.value)}
              placeholder="Search games or services..."
              className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
              autoFocus
            />
            <button type="button" onClick={() => setLinkPickerOpen(false)} className="opacity-60 hover:opacity-100" aria-label="Close link picker">
              <X size={15} />
            </button>
          </div>
          <div className="mt-3 max-h-48 overflow-y-auto">
            {isSearching ? (
              <div className="space-y-2">
                <div className="h-14 animate-pulse rounded-md bg-white/10" />
                <div className="h-14 animate-pulse rounded-md bg-white/10" />
              </div>
            ) : results.length === 0 ? (
              <p className="px-1 py-3 text-xs opacity-70">Search by game or service name.</p>
            ) : (
              <div className="space-y-2">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.href}`}
                    type="button"
                    onClick={() => addLinkAttachment(result)}
                    className="flex w-full items-center gap-3 rounded-md border border-white/10 p-2 text-left hover:border-[var(--ms-gradient-end)]"
                  >
                    {result.image ? <img src={result.image} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 rounded bg-white/10" />}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{result.title}</span>
                      <span className="block truncate text-xs opacity-70">{result.type} / {result.meta}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) addImage(file);
          }}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-white/15 px-3 text-xs opacity-80 hover:border-[var(--ms-gradient-end)] hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ImagePlus size={15} />
          Image
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setLinkPickerOpen((current) => !current)}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-white/15 px-3 text-xs opacity-80 hover:border-[var(--ms-gradient-end)] hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <LinkIcon size={15} />
          Game/Service
        </button>
      </div>
    </div>
  );
}
