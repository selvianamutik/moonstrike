import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { listAuditLogs } from "@/lib/admin/logs";
import { LogsPageClient } from "./LogsPageClient";

export default async function LogsPage() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin/login?next=/admin/logs");
  }

  const logs = await listAuditLogs();
  const stats = {
    totalEvents: logs.length,
    successfulActions: logs.filter((log) => log.status === "success").length,
    blockedOrRateLimited: logs.filter(
      (log) => log.status === "blocked" || log.action.toLowerCase().includes("rate limit"),
    ).length,
    criticalEvents: logs.filter((log) => log.status === "critical").length,
  };

  return <LogsPageClient logs={logs} stats={stats} />;
}
