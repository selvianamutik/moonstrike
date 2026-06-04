"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefundRequestButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState("");

  async function requestRefund() {
    const confirmed = window.confirm(
      "Request a refund for this order? Moon Strike will review the request before any money is returned. Delivery work may pause while the refund is reviewed.",
    );

    if (!confirmed) return;

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
    }
  }

  return (
    <div>
      <p className="mb-3 max-w-md text-xs leading-5 text-amber-300">
        Refund requests pause review of this order and must be approved before money is returned.
      </p>
      <button type="button" onClick={requestRefund} disabled={isRequesting} className="ms-button px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60">
        {isRequesting ? "Requesting..." : "Request Refund"}
      </button>
      {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
