"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink } from "lucide-react";
import type { ChatAttachment } from "@/lib/chat";

export function ChatAttachments({ attachments }: { attachments: ChatAttachment[] }) {
  const [openImage, setOpenImage] = useState<Extract<ChatAttachment, { type: "image" }> | null>(null);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [copiedHref, setCopiedHref] = useState("");

  useEffect(() => {
    if (!openImage) {
      setImageZoomed(false);
      return;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenImage(null);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [openImage]);

  async function copyLink(href: string) {
    await navigator.clipboard.writeText(new URL(href, window.location.origin).toString()).catch(() => null);
    setCopiedHref(href);
    window.setTimeout(() => setCopiedHref((current) => (current === href ? "" : current)), 1400);
  }

  if (attachments.length === 0) return null;

  return (
    <>
      <div className="mt-3 space-y-2">
        {attachments.map((attachment, index) => {
          if (attachment.type === "image") {
            return (
              <button
                key={`${attachment.url}-${index}`}
                type="button"
                onClick={() => setOpenImage(attachment)}
                className="block w-80 max-w-full overflow-hidden rounded-lg border border-[var(--ms-border)] bg-[var(--ms-bg-card)] text-left transition hover:border-[var(--ms-gradient-end)]"
                title="Open image full size"
              >
                <img src={attachment.url} alt={attachment.filename || "Chat attachment"} className="max-h-72 w-full object-cover" />
              </button>
            );
          }

          // Detect deleted game/service: broken href, sentinel titles, or empty title
          const GAME_DELETED_SENTINELS = new Set([
            "[Deleted]",
            "This game has been deleted",
            "game no longer exist",
          ]);
          const isDeleted =
            attachment.href === "#" ||
            !attachment.href ||
            GAME_DELETED_SENTINELS.has(attachment.title);
          const displayTitle = isDeleted ? "game no longer exist" : attachment.title;
          
          return (
            <div
              key={`${attachment.href}-${index}`}
              className="w-80 max-w-full rounded-lg border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-3"
            >
              {isDeleted ? (
                <div className="flex gap-3 opacity-60">
                  <div className="h-16 w-16 shrink-0 rounded-md border border-[var(--ms-border)] bg-[var(--ms-hover-bg)]" />
                  <span className="min-w-0">
                    <span className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--ms-gradient-end)]">{attachment.linkType}</span>
                    <span className="mt-1 block truncate text-sm font-bold text-[var(--ms-body)] italic">{displayTitle}</span>
                    {attachment.meta ? <span className="mt-1 block truncate text-xs text-[var(--ms-body)]">{attachment.meta}</span> : null}
                  </span>
                </div>
              ) : (
                <>
                  <Link href={attachment.href} target="_blank" rel="noreferrer" className="flex gap-3 transition hover:text-[var(--ms-gradient-end)]">
                    {attachment.image ? (
                      <img src={attachment.image} alt="" className="h-16 w-16 shrink-0 rounded-md object-cover" />
                    ) : (
                      <div className="h-16 w-16 shrink-0 rounded-md border border-[var(--ms-border)] bg-[var(--ms-hover-bg)]" />
                    )}
                    <span className="min-w-0">
                      <span className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--ms-gradient-end)]">{attachment.linkType}</span>
                      <span className="mt-1 block truncate text-sm font-bold text-[var(--ms-heading)]">{attachment.title}</span>
                      {attachment.meta ? <span className="mt-1 block truncate text-xs text-[var(--ms-body)]">{attachment.meta}</span> : null}
                    </span>
                  </Link>
                  <div className="mt-3 flex gap-2">
                    <Link
                      href={attachment.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[var(--ms-gradient-end)] px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-white transition-opacity hover:opacity-80"
                    >
                      <ExternalLink size={13} />
                      Open
                    </Link>
                    <button
                      type="button"
                      onClick={() => void copyLink(attachment.href)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--ms-border)] bg-[var(--ms-hover-bg)] px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--ms-heading)] transition-colors hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-gradient-end)]"
                    >
                      <Copy size={13} />
                      {copiedHref === attachment.href ? "Copied" : "Copy"}
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {openImage ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4" onClick={() => setOpenImage(null)}>
          <div className="relative max-h-[90vh] max-w-[95vw] overflow-auto rounded-lg" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setImageZoomed((current) => !current)}
              className={`block rounded-lg ${imageZoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
              aria-label={imageZoomed ? "Zoom out image" : "Zoom in image"}
            >
              <img
                src={openImage.url}
                alt={openImage.filename || "Chat attachment"}
                className={
                  imageZoomed
                    ? "h-auto w-[150vw] max-w-none rounded-lg object-contain md:w-[120vw]"
                    : "max-h-[90vh] max-w-full rounded-lg object-contain"
                }
              />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
