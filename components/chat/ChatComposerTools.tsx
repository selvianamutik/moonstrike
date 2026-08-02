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
  /** Optional user ID for loading personalized suggestions */
  userId?: string | null;
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

  return { uploadedImages, attachments: resolved };
}

export function ChatComposerTools({ attachments, disabled = false, onAttachmentsChange, onError, userId }: ChatComposerToolsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingAttachmentsRef = useRef(attachments);
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Load suggestions when link picker opens
  useEffect(() => {
    if (!linkPickerOpen) return;
    if (suggestions.length > 0) return; // already loaded

    setIsLoadingSuggestions(true);
    const url = userId
      ? `/api/chat/suggestions?userId=${encodeURIComponent(userId)}`
      : "/api/chat/suggestions";

    fetch(url, { cache: "no-store" })
      .then((r) => r.json().catch(() => ({})))
      .then((payload) => {
        if (Array.isArray(payload.suggestions)) {
          setSuggestions(payload.suggestions);
        }
      })
      .catch(() => null)
      .finally(() => setIsLoadingSuggestions(false));
  }, [linkPickerOpen, userId, suggestions.length]);

  useEffect(() => {
    pendingAttachmentsRef.current = attachments;
  }, [attachments]);

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
      ...pendingAttachmentsRef.current,
      {
        type: "link",
        linkType: result.type === "Game" ? "game" : "service",
        title: result.title,
        href: result.href,
        image: result.image,
        meta: result.meta,
      },
    ]);
    setQuery("");
    setResults([]);
    setLinkPickerOpen(false);
  }

  // Items to render: search results when typing, otherwise suggestions
  const displayItems = query.trim().length >= 2 ? results : suggestions;
  const showSkeleton = query.trim().length >= 2 ? isSearching : isLoadingSuggestions;
  const emptyLabel = query.trim().length >= 2
    ? "No results found."
    : "No suggestions available.";
  const headerLabel = query.trim().length >= 2
    ? null
    : suggestions.length > 0
      ? "Suggested for you"
      : null;

  return (
    <div>
      {attachments.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div key={index} className="flex max-w-full items-center gap-2 rounded-md border border-[var(--ms-border)] bg-[var(--ms-bg-page)] px-2 py-1.5 text-xs">
              {attachment.type === "image" || attachment.type === "draft_image" ? (
                <img src={attachment.type === "draft_image" ? attachment.previewUrl : attachment.url} alt="" className="h-8 w-8 rounded object-cover" />
              ) : attachment.image ? (
                <img src={attachment.image} alt="" className="h-8 w-8 rounded object-cover" />
              ) : (
                <span className="grid h-8 w-8 place-items-center rounded bg-[var(--ms-hover-bg)]">
                  <LinkIcon size={14} />
                </span>
              )}
              <span className="min-w-0 max-w-[180px] truncate text-[var(--ms-heading)]">
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
        <div className="mb-3 overflow-hidden rounded-lg border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-3">
          {/* Search input */}
          <div className="flex items-center gap-2 rounded-md border border-[var(--ms-border)] bg-[var(--ms-bg-page)] px-3">
            <Search size={15} className="shrink-0 opacity-60 text-[var(--ms-body)]" />
            <input
              value={query}
              onChange={(event) => void searchLinks(event.target.value)}
              placeholder="Search games or services..."
              className="h-10 min-w-0 flex-1 bg-transparent text-sm text-[var(--ms-heading)] outline-none placeholder:text-[var(--ms-body)]"
              autoFocus
            />
            <button
              type="button"
              onClick={() => { setLinkPickerOpen(false); setQuery(""); setResults([]); }}
              className="shrink-0 opacity-60 hover:opacity-100 text-[var(--ms-body)]"
              aria-label="Close link picker"
            >
              <X size={15} />
            </button>
          </div>

          {/* Results / suggestions */}
          <div className="mt-3 max-h-52 overflow-y-auto">
            {showSkeleton ? (
              <div className="space-y-2">
                <div className="h-14 animate-pulse rounded-md bg-[var(--ms-border)]" />
                <div className="h-14 animate-pulse rounded-md bg-[var(--ms-border)]" />
                <div className="h-14 animate-pulse rounded-md bg-[var(--ms-border)]" />
              </div>
            ) : displayItems.length === 0 ? (
              <p className="px-1 py-3 text-xs text-[var(--ms-body)]">{emptyLabel}</p>
            ) : (
              <div className="space-y-1.5">
                {headerLabel && (
                  <p className="px-1 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ms-gradient-end)]">
                    {headerLabel}
                  </p>
                )}
                {displayItems.map((result) => (
                  <button
                    key={`${result.type}-${result.href}`}
                    type="button"
                    onClick={() => addLinkAttachment(result)}
                    className="flex w-full items-center gap-3 rounded-md border border-[var(--ms-border)] p-2 text-left transition-colors hover:border-[var(--ms-gradient-end)] hover:bg-[var(--ms-hover-bg)]"
                  >
                    {result.image
                      ? <img src={result.image} alt="" className="h-10 w-10 rounded object-cover" />
                      : <div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-[var(--ms-hover-bg)] text-[var(--ms-body)]"><LinkIcon size={14} /></div>
                    }
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-[var(--ms-heading)]">{result.title}</span>
                      <span className="block truncate text-xs text-[var(--ms-body)]">
                        {result.type} {result.meta ? `/ ${result.meta}` : ""}
                      </span>
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
          className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--ms-border)] px-3 text-xs text-[var(--ms-body)] opacity-80 hover:border-[var(--ms-gradient-end)] hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ImagePlus size={15} />
          Image
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setLinkPickerOpen((current) => !current)}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--ms-border)] px-3 text-xs text-[var(--ms-body)] opacity-80 hover:border-[var(--ms-gradient-end)] hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <LinkIcon size={15} />
          Game/Service
        </button>
      </div>
    </div>
  );
}
