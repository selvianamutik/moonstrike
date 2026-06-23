"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { TrustpilotReviewCollector } from "@/components/trustpilot-review-collector";

const REVIEW_PROMPT_EVENT = "moonstrike:trustpilot-review-open";
const REVIEW_PROMPT_STORAGE_KEY = "moonstrike:trustpilot-review-prompt";

export function openTrustpilotReviewPrompt(orderId: string) {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(REVIEW_PROMPT_STORAGE_KEY, orderId);
  window.dispatchEvent(new CustomEvent(REVIEW_PROMPT_EVENT, { detail: { orderId } }));
}

export function TrustpilotReviewPrompt({ orderId }: { orderId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem(REVIEW_PROMPT_STORAGE_KEY) === orderId) {
      setIsOpen(true);
    }

    function openPrompt(event: Event) {
      const detail = (event as CustomEvent<{ orderId?: string }>).detail;
      if (detail?.orderId === orderId) setIsOpen(true);
    }

    window.addEventListener(REVIEW_PROMPT_EVENT, openPrompt);
    return () => window.removeEventListener(REVIEW_PROMPT_EVENT, openPrompt);
  }, [orderId]);

  useEffect(() => {
    window.dispatchEvent(new Event(isOpen ? "moonstrike:live-refresh-suspend" : "moonstrike:live-refresh-resume"));

    return () => {
      window.dispatchEvent(new Event("moonstrike:live-refresh-resume"));
    };
  }, [isOpen]);

  function closePrompt() {
    window.sessionStorage.removeItem(REVIEW_PROMPT_STORAGE_KEY);
    window.dispatchEvent(new Event("moonstrike:live-refresh-resume"));
    setIsOpen(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-4">
      <div className="w-full max-w-xl rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mono text-xs font-bold uppercase tracking-[0.16em] text-[var(--ms-gradient-end)]">
              Order completed
            </p>
            <h2 className="mt-2 text-2xl font-black text-[var(--ms-heading)]">Thanks for confirming your order</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--ms-body)]">
              Your feedback helps other players choose with confidence. Leaving a Trustpilot review is optional and only takes a moment.
            </p>
          </div>
          <button
            type="button"
            onClick={closePrompt}
            className="rounded-lg p-1.5 text-[var(--ms-body)] transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close review prompt"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 rounded-lg border border-[var(--ms-border)] bg-black/15 p-4">
          <TrustpilotReviewCollector />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={closePrompt}
            className="rounded-lg border border-[var(--ms-border)] px-4 py-2.5 text-sm font-bold text-[var(--ms-body)] transition-colors hover:border-[var(--ms-gradient-end)] hover:text-white"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
