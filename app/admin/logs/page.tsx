"use client";

import React, { useState } from "react";
import { Download, Activity, Shield, AlertCircle } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { StatusBadge, type StatusType } from "@/components/admin/StatusBadge";
import { auditLogs, logStats } from "@/lib/admin-mock";

export default function LogsPage() {
  const [dateRange, setDateRange] = useState("Last 24 Hours");
  const [eventType, setEventType] = useState("All Events");
  const [userFilter, setUserFilter] = useState("");

  const filtered = auditLogs.filter((log) => {
    if (!userFilter) return true;
    return log.actorLabel.toLowerCase().includes(userFilter.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <AdminPageHeader
        breadcrumbs={[{ label: "System" }, { label: "Audit Logs", active: true }]}
        title="System Audit Trail"
        description="Real-time monitoring of administrative and system-level events."
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

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-4">
          <label className="text-xs text-[var(--ms-text-secondary)] uppercase mb-2 block">Date Range</label>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="w-full bg-[var(--ms-primary)] border border-[var(--ms-accent)] text-white text-sm rounded-lg px-3 py-2">
            <option>Last 24 Hours</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
        </div>
        <div className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-4">
          <label className="text-xs text-[var(--ms-text-secondary)] uppercase mb-2 block">Event Type</label>
          <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full bg-[var(--ms-primary)] border border-[var(--ms-accent)] text-white text-sm rounded-lg px-3 py-2">
            <option>All Events</option>
            <option>Login</option>
            <option>Permission Change</option>
            <option>Security</option>
          </select>
        </div>
        <div className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-4">
          <label className="text-xs text-[var(--ms-text-secondary)] uppercase mb-2 block">Actor Filter</label>
          <input
            type="text"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            placeholder="Search actor..."
            className="w-full bg-[var(--ms-primary)] border border-[var(--ms-accent)] text-white text-sm rounded-lg px-3 py-2 placeholder-[#64748B]"
          />
        </div>
        <div className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-4 flex items-end">
          <button
            type="button"
            onClick={() => {
              setDateRange("Last 24 Hours");
              setEventType("All Events");
              setUserFilter("");
            }}
            className="w-full py-2 text-sm text-[var(--ms-text-secondary)] border border-[var(--ms-accent)] rounded-lg hover:text-white"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <AdminDataTable
        columns={["TIMESTAMP", "ACTOR", "ACTION", "IP ADDRESS", "STATUS"]}
        footer={<AdminPagination showingFrom={1} showingTo={filtered.length} total={1248} totalPages={250} />}
      >
        {filtered.map((log) => (
          <tr key={log.id} className="hover:bg-[#111827] transition-colors">
            <td className="px-6 py-4 text-white font-mono text-xs">{log.timestamp}</td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[var(--ms-accent)] flex items-center justify-center text-[10px] text-white font-bold">
                  {log.actorInitials}
                </div>
                <span className="text-white">{log.actorLabel}</span>
              </div>
            </td>
            <td className="px-6 py-4 text-white max-w-md text-sm">{log.action}</td>
            <td className="px-6 py-4 font-mono text-xs text-[var(--ms-text-secondary)]">{log.ip ?? "—"}</td>
            <td className="px-6 py-4">
              <StatusBadge status={log.status as StatusType} />
            </td>
          </tr>
        ))}
      </AdminDataTable>

      <div className="grid grid-cols-3 gap-6">
        <AdminStatCard title="UPTIME PERFORMANCE" value={logStats.uptime} icon={<Activity size={18} className="text-green-500" />} progressColor="bg-green-500" progressWidth="w-[99%]" />
        <AdminStatCard title="BLOCKED THREATS" value={logStats.blockedThreats} icon={<Shield size={18} className="text-[#22D3EE]" />} progressColor="bg-[#22D3EE]" progressWidth="w-[60%]" />
        <AdminStatCard title="ACTIVE ANOMALIES" value={logStats.activeAnomalies} icon={<AlertCircle size={18} className="text-amber-500" />} progressColor="bg-amber-500" progressWidth="w-[20%]" />
      </div>
    </div>
  );
}
