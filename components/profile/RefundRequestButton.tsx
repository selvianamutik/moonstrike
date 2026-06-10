"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

export function RefundRequestButton({ orderId, compact = false }: { orderId: string; compact?: boolean }) {
  const router = useRouter();
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  async function requestRefund() {
    setIsRequesting(true);
    setError("");

    try {
      const response = await fetch(`/api/orders/${orderId}/refund-request`, {
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to request refund.");
        return;
      }

      router.refresh();
    } catch {
      setError("Unable to reach refund service.");
    } finally {
      setIsRequesting(false);
      setIsConfirmOpen(false);
    }
  }

  return (
    <div>
      {!compact ? (
        <p className="mb-3 max-w-md text-xs leading-5 text-amber-300">
          Refund requests pause review of this order and must be approved before money is returned.
        </p>
      ) : null}
      <button type="button" onClick={() => setIsConfirmOpen(true)} disabled={isRequesting} className="ms-button px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60">
        <RotateCcw size={16} />
        {isRequesting ? "Requesting..." : "Request Refund"}
      </button>
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
      <ConfirmDialog
        open={isConfirmOpen}
        title="Request refund?"
        description="MoonStrike will review the request before any money is returned. Delivery work may pause while the refund is reviewed."
        confirmLabel="Request Refund"
        variant="warning"
        isLoading={isRequesting}
        onClose={() => {
          if (!isRequesting) setIsConfirmOpen(false);
        }}
        onConfirm={requestRefund}
      />
    </div>
  );
}
