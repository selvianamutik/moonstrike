"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { AdminButton } from "@/components/admin/AdminButton";

type SheetsSyncTarget = "orders" | "transactions" | "all";

export function SheetsSyncButton({
  target,
  label = "Sync Sheets",
}: {
  target: SheetsSyncTarget;
  label?: string;
}) {
  const [status, setStatus] = useState<"idle" | "syncing" | "done" | "error">("idle");

  async function syncSheets() {
    setStatus("syncing");

    try {
      const response = await fetch("/api/admin/sheets/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to sync Google Sheets.");
      }

      setStatus("done");
      window.setTimeout(() => setStatus("idle"), 2500);
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  }

  const statusLabel =
    status === "syncing" ? "Syncing..." : status === "done" ? "Synced" : status === "error" ? "Failed" : label;

  return (
    <AdminButton type="button" variant="secondary" onClick={syncSheets} disabled={status === "syncing"}>
      <RefreshCw size={16} className={status === "syncing" ? "animate-spin" : ""} />
      {statusLabel}
    </AdminButton>
  );
}
