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
    uptime: "99.998%",
    blockedThreats: String(logs.filter((log) => log.status === "blocked").length),
    activeAnomalies: String(logs.filter((log) => log.status === "critical").length),
  };

  return <LogsPageClient logs={logs} stats={stats} />;
}
