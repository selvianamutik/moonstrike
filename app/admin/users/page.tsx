"use client";

import React, { useMemo, useState } from "react";
import { Plus, Users, Package, RefreshCw, AlertTriangle } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminButton } from "@/components/admin/AdminButton";
import { RoleBadge } from "@/components/admin/RoleBadge";
import { UserStatusDot } from "@/components/admin/UserStatusDot";
import { ActionIcons } from "@/components/admin/ActionIcons";
import { adminUsers, userStats } from "@/lib/admin-mock";

export default function UsersPage() {
  const [statusFilter, setStatusFilter] = useState("All Status");
  const currentAdminId = "adm3";

  const filtered = useMemo(() => {
    if (statusFilter === "All Status") return adminUsers;
    return adminUsers.filter((u) => u.status === statusFilter.toLowerCase());
  }, [statusFilter]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <AdminPageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Users", active: true }]}
        title="User Registry"
        description="Manage admin accounts for the MoonStrike terminal. Storefront customers are managed via Supabase Auth."
        actions={
          <>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-[#8B5CF6]"
            >
              <option>All Status</option>
              <option>active</option>
              <option>pending</option>
              <option>banned</option>
            </select>
            <AdminButton href="/admin/users/new">
              <Plus size={16} />
              Add New User
            </AdminButton>
          </>
        }
      />

      <AdminDataTable columns={["NAME", "EMAIL", "ROLE", "STATUS", "LAST LOGIN", "ACTIONS"]}>
        {filtered.map((user) => {
          const isSelf = user.id === currentAdminId;
          const isOnlyAdmin = adminUsers.length === 1;
          const banDisabled = isSelf || isOnlyAdmin;

          return (
            <tr key={user.id} className="hover:bg-[#111827] transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--ms-accent)] border border-[#22D3EE]/30 flex items-center justify-center text-xs text-white font-bold">
                    {user.avatarInitials}
                  </div>
                  <span className={`text-white font-medium ${user.status === "banned" ? "line-through text-[#64748B]" : ""}`}>
                    {user.name}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">{user.email}</td>
              <td className="px-6 py-4">
                <RoleBadge role={user.role} />
              </td>
              <td className="px-6 py-4">
                <UserStatusDot status={user.status} />
              </td>
              <td className="px-6 py-4">{user.lastLogin}</td>
              <td className="px-6 py-4">
                <ActionIcons
                  editHref={`/admin/users/${user.id}`}
                  historyHref={`/admin/logs?actor=${user.id}`}
                  onBan={
                    banDisabled
                      ? undefined
                      : () => alert(isOnlyAdmin ? "Cannot ban the only admin account." : isSelf ? "Cannot ban your own account." : "Ban user (mock)")
                  }
                />
              </td>
            </tr>
          );
        })}
      </AdminDataTable>

      <AdminPagination showingFrom={1} showingTo={filtered.length} total={userStats.totalUsers} totalPages={1} />

      <div className="grid grid-cols-4 gap-6">
        <AdminStatCard title="TOTAL USERS" value={String(userStats.totalUsers)} icon={<Users size={18} className="text-[#8B5CF6]" />} progressColor="bg-[#8B5CF6]" progressWidth="w-[40%]" />
        <AdminStatCard title="ACTIVE ORDERS" value={String(userStats.activeOrders)} subtitle="In pipeline" icon={<Package size={18} className="text-[#22D3EE]" />} progressColor="bg-[#22D3EE]" progressWidth="w-[50%]" />
        <AdminStatCard title="PENDING REFUNDS" value={String(userStats.pendingRefunds)} subtitle="Needs action" icon={<RefreshCw size={18} className="text-amber-500" />} progressColor="bg-amber-500" progressWidth="w-[25%]" />
        <AdminStatCard title="BANNED/FLAGGED" value={String(userStats.bannedFlagged)} subtitle="Safety score: 98%" icon={<AlertTriangle size={18} className="text-red-500" />} progressColor="bg-red-500" progressWidth="w-[10%]" />
      </div>
    </div>
  );
}
