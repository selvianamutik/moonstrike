"use client";

import React, { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Download, ListChecks, Shield } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { StatusBadge, type StatusType } from "@/components/admin/StatusBadge";
import type { AuditLogRow } from "@/lib/admin/logs";

const EVENT_TYPE_OPTIONS: Array<{ label: string; value: AuditLogRow["event_type"] | "all" }> = [
  { label: "All Events", value: "all" },
  { label: "Auth", value: "auth" },
  { label: "Admin Action", value: "admin_action" },
  { label: "Checkout", value: "checkout" },
  { label: "Payment Webhook", value: "payment_webhook" },
  { label: "Refund", value: "refund" },
  { label: "Order Lifecycle", value: "order_lifecycle" },
  { label: "CMS", value: "cms" },
  { label: "Settings", value: "settings" },
  { label: "Cron", value: "cron" },
  { label: "Security", value: "security" },
];

type LogStats = {
  totalEvents: number;
  successfulActions: number;
  blockedOrRateLimited: number;
  criticalEvents: number;
};

function getInitials(label: string) {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "SY";
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

function matchesDateRange(timestamp: string, dateRange: string) {
  const createdAt = new Date(timestamp).getTime();
  const now = Date.now();
  const ranges: Record<string, number> = {
    "Last 24 Hours": 24 * 60 * 60 * 1000,
    "Last 7 Days": 7 * 24 * 60 * 60 * 1000,
    "Last 30 Days": 30 * 24 * 60 * 60 * 1000,
  };

  return now - createdAt <= (ranges[dateRange] ?? ranges["Last 24 Hours"]);
}

function matchesEventType(log: AuditLogRow, eventType: string) {
  return eventType === "all" || log.event_type === eventType;
}

function eventTypeLabel(value: AuditLogRow["event_type"]) {
  return EVENT_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function LogsPageClient({ logs, stats }: { logs: AuditLogRow[]; stats: LogStats }) {
  const [dateRange, setDateRange] = useState("Last 24 Hours");
  const [eventType, setEventType] = useState("all");
  const [userFilter, setUserFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(
    () =>
      logs.filter((log) => {
        const query = userFilter.trim().toLowerCase();
        const matchesActor =
          !query ||
          log.actor_label.toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query);

        return (
          matchesActor &&
          matchesDateRange(log.timestamp, dateRange) &&
          matchesEventType(log, eventType)
        );
      }),
    [dateRange, eventType, logs, userFilter]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedLogs = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const showingFrom = filtered.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const showingTo = filtered.length > 0 ? showingFrom + pagedLogs.length - 1 : 0;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <AdminPageHeader
        breadcrumbs={[{ label: "System" }, { label: "Audit Logs", active: true }]}
        title="System Audit Trail"
        description="Administrative and system-level events from the audit_logs table."
        actions={
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-[var(--ms-accent)] border border-[var(--ms-accent)] rounded-lg text-sm font-medium text-white"
          >
            <Download size={16} />
            Export CSV
          </button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard title="TOTAL EVENTS" value={String(stats.totalEvents)} subtitle="Loaded audit records" icon={<ListChecks size={18} className="text-[#8B5CF6]" />} progressColor="bg-[#8B5CF6]" progressWidth="w-[65%]" />
        <AdminStatCard title="SUCCESSFUL ACTIONS" value={String(stats.successfulActions)} subtitle="Completed admin/system events" icon={<CheckCircle2 size={18} className="text-green-500" />} progressColor="bg-green-500" progressWidth="w-[60%]" />
        <AdminStatCard title="BLOCKED / RATE LIMITED" value={String(stats.blockedOrRateLimited)} subtitle="Security guardrail events" icon={<Shield size={18} className="text-[#22D3EE]" />} progressColor="bg-[#22D3EE]" progressWidth="w-[35%]" />
        <AdminStatCard title="CRITICAL EVENTS" value={String(stats.criticalEvents)} subtitle="Needs investigation" icon={<AlertCircle size={18} className="text-amber-500" />} progressColor="bg-amber-500" progressWidth="w-[20%]" />
      </div>

      <div className="rounded-xl border border-[var(--ms-accent)] bg-[var(--ms-secondary)] p-4">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_1.4fr_auto] md:items-end">
          <label className="block">
            <span className="mb-2 block text-xs uppercase text-[var(--ms-text-secondary)]">Date Range</span>
            <select value={dateRange} onChange={(e) => { setDateRange(e.target.value); setPage(1); }} className="w-full bg-[var(--ms-primary)] border border-[var(--ms-accent)] text-white text-sm rounded-lg px-3 py-2">
            <option>Last 24 Hours</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase text-[var(--ms-text-secondary)]">Event Type</span>
            <select value={eventType} onChange={(e) => { setEventType(e.target.value); setPage(1); }} className="w-full bg-[var(--ms-primary)] border border-[var(--ms-accent)] text-white text-sm rounded-lg px-3 py-2">
              {EVENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase text-[var(--ms-text-secondary)]">Actor / Action Filter</span>
            <input
              type="text"
              value={userFilter}
              onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}
              placeholder="Search actor or action..."
              className="w-full bg-[var(--ms-primary)] border border-[var(--ms-accent)] text-white text-sm rounded-lg px-3 py-2 placeholder-[#64748B]"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setDateRange("Last 24 Hours");
              setEventType("all");
              setUserFilter("");
              setPage(1);
            }}
            className="h-10 rounded-lg border border-[var(--ms-accent)] px-4 text-sm text-[var(--ms-text-secondary)] transition-colors hover:text-white md:w-36"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <AdminDataTable
        columns={["TIMESTAMP", "ACTOR", "EVENT TYPE", "ACTION", "IP ADDRESS", "STATUS"]}
        footer={
          <AdminPagination
            showingFrom={showingFrom}
            showingTo={showingTo}
            total={filtered.length}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize);
              setPage(1);
            }}
          />
        }
      >
        {pagedLogs.map((log) => (
          <tr key={log.id} className="hover:bg-[#111827] transition-colors">
            <td className="px-6 py-4 text-white font-mono text-xs">{formatTimestamp(log.timestamp)}</td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[var(--ms-accent)] flex items-center justify-center text-[10px] text-white font-bold">
                  {getInitials(log.actor_label)}
                </div>
                <span className="text-white">{log.actor_label}</span>
              </div>
            </td>
            <td className="px-6 py-4">
              <span className="inline-flex rounded-md border border-[var(--ms-accent)] bg-[var(--ms-primary)] px-2 py-1 text-xs font-medium text-[var(--ms-text-secondary)]">
                {eventTypeLabel(log.event_type)}
              </span>
            </td>
            <td className="px-6 py-4 text-white max-w-md text-sm">{log.action}</td>
            <td className="px-6 py-4 font-mono text-xs text-[var(--ms-text-secondary)]">{log.ip_address ?? "-"}</td>
            <td className="px-6 py-4">
              <StatusBadge status={log.status as StatusType} />
            </td>
          </tr>
        ))}
      </AdminDataTable>

    </div>
  );
}
