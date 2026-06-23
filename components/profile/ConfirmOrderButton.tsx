"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { openTrustpilotReviewPrompt } from "@/components/profile/TrustpilotReviewPrompt";

export function ConfirmOrderButton({ orderId }: { orderId: string }) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function confirmOrder() {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/orders/${orderId}/complete`, {
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to confirm order.");
        return;
      }

      openTrustpilotReviewPrompt(orderId);
    } catch {
      setError("Unable to reach order service.");
    } finally {
      setIsSubmitting(false);
      setIsConfirmOpen(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={() => setIsConfirmOpen(true)} disabled={isSubmitting} className="ms-button px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60">
        <CheckCircle2 size={16} />
        {isSubmitting ? "Confirming..." : "Confirm Complete"}
      </button>
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
      <ConfirmDialog
        open={isConfirmOpen}
        title="Confirm order complete?"
        description="This marks the delivered order as completed. You can still request a refund until the configured refund window ends."
        confirmLabel="Confirm Complete"
        variant="primary"
        isLoading={isSubmitting}
        onClose={() => {
          if (!isSubmitting) setIsConfirmOpen(false);
        }}
        onConfirm={confirmOrder}
      />
    </div>
  );
}
