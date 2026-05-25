"use client";

import React from "react";
import Link from "next/link";
import { Ban, RotateCcw, ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminButton } from "@/components/admin/AdminButton";
import { RoleBadge } from "@/components/admin/RoleBadge";
import { UserStatusDot } from "@/components/admin/UserStatusDot";
import { AdminFormField, adminInputClass } from "@/components/admin/AdminFormField";
import type { AdminUser } from "@/lib/admin-mock";
import { adminUsers } from "@/lib/admin-mock";

export function UserDetailView({ user }: { user: AdminUser }) {
  const isSelf = user.id === "adm3";
  const isOnlyAdmin = adminUsers.length === 1;

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Users", href: "/admin/users" }, { label: user.name, active: true }]}
        title={user.name}
        actions={
          <Link href="/admin/users" className="flex items-center gap-2 text-sm text-[var(--ms-text-secondary)] hover:text-white">
            <ArrowLeft size={16} /> Back
          </Link>
        }
      />

      <div className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[var(--ms-accent)] border-2 border-[#22D3EE]/30 flex items-center justify-center text-xl font-bold text-white">
            {user.avatarInitials}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <RoleBadge role={user.role} />
              <UserStatusDot status={user.status} />
            </div>
            <p className="text-[var(--ms-text-secondary)] text-sm">{user.email}</p>
            <p className="text-[#64748B] text-xs mt-1">Last login: {user.lastLogin}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <AdminFormField label="Admin Display Name">
            <input className={adminInputClass} defaultValue={user.name} />
          </AdminFormField>
          <AdminFormField label="Email">
            <input className={adminInputClass} defaultValue={user.email} />
          </AdminFormField>
        </div>

        <div className="flex gap-3 pt-2 border-t border-[var(--ms-accent)]">
          <AdminButton variant="secondary">
            <RotateCcw size={16} /> Reset Password
          </AdminButton>
          {user.status !== "banned" && (
            <AdminButton
              variant="danger"
              onClick={() =>
                alert(isSelf ? "SELF_BAN_NOT_ALLOWED" : isOnlyAdmin ? "LAST_ADMIN_NOT_ALLOWED" : "Ban user (mock)")
              }
            >
              <Ban size={16} /> Ban User
            </AdminButton>
          )}
          <AdminButton type="button">Save Changes</AdminButton>
        </div>
      </div>
    </div>
  );
}
