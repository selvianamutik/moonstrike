"use client";

import React, { useState } from "react";
import { Shield, ShieldCheck, Trash2, UserCog, Plus, X, Eye, EyeOff, Pencil, Check } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminButton } from "@/components/admin/AdminButton";
import { adminInputClass, adminSelectClass } from "@/components/admin/AdminFormField";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import type { AdminUserRecord, RolePermission } from "@/lib/admin/admin-users";
import type { AdminRole } from "@/lib/admin/auth";

const roleLabels: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  support: "Support",
};

const roleColors: Record<AdminRole, string> = {
  super_admin: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  admin: "text-[#22D3EE] bg-[#22D3EE]/10 border-[#22D3EE]/30",
  support: "text-green-400 bg-green-500/10 border-green-500/30",
};

const roleAccentBorder: Record<AdminRole, string> = {
  super_admin: "border-purple-500/30",
  admin: "border-[#22D3EE]/30",
  support: "border-green-500/30",
};

const roleAccentBg: Record<AdminRole, string> = {
  super_admin: "bg-purple-500/10",
  admin: "bg-[#22D3EE]/10",
  support: "bg-green-500/10",
};

const roleAccentText: Record<AdminRole, string> = {
  super_admin: "text-purple-400",
  admin: "text-[#22D3EE]",
  support: "text-green-400",
};

const roleTagBg: Record<AdminRole, string> = {
  super_admin: "bg-purple-500/5 border-purple-500/20 text-purple-300",
  admin: "bg-[#22D3EE]/5 border-[#22D3EE]/20 text-[#22D3EE]",
  support: "bg-green-500/5 border-green-500/20 text-green-300",
};

const AVAILABLE_PERMISSIONS = [
  { key: "users", label: "Users" },
  { key: "games", label: "Games" },
  { key: "services", label: "Services & Private Offers" },
  { key: "orders", label: "Orders" },
  { key: "transactions", label: "Transactions" },
  { key: "content", label: "Content & Pages" },
  { key: "messages", label: "Messages" },
  { key: "logs", label: "Logs" },
  { key: "settings", label: "Settings" },
  { key: "admins", label: "Admin Accounts" },
];

const permissionLabels: Record<string, string> = {
  users: "Users",
  games: "Games",
  services: "Services & Private Offers",
  orders: "Orders",
  transactions: "Transactions",
  content: "Content & Pages",
  messages: "Messages",
  logs: "Logs",
  settings: "Settings",
  admins: "Admin Accounts",
};

export function AdminsPageClient({
  admins: initialAdmins,
  currentAdminId,
  isSuperAdmin,
  initialRolePermissions,
}: {
  admins: AdminUserRecord[];
  currentAdminId: string;
  isSuperAdmin: boolean;
  initialRolePermissions: RolePermission[];
}) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<AdminRole>("admin");
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AdminUserRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Add Admin state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ display_name: "", email: "", password: "", role: "admin" as AdminRole });
  const [showPassword, setShowPassword] = useState(false);
  const [addError, setAddError] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Role Permission editing state
  const [rolePerms, setRolePerms] = useState<RolePermission[]>(initialRolePermissions);
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null);
  const [editPermDescription, setEditPermDescription] = useState("");
  const [editPermList, setEditPermList] = useState<string[]>([]);
  const [newPermItem, setNewPermItem] = useState("");
  const [isSavingPerms, setIsSavingPerms] = useState(false);

  function getRolePerm(role: AdminRole): RolePermission {
    return rolePerms.find((rp) => rp.role === role) ?? {
      role,
      description: "",
      permissions: [],
      updated_at: "",
    };
  }

  async function saveRole(id: string) {
    setError("");
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/admin-users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: editRole }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) { setError(result?.error ?? "Failed to update."); return; }
      setAdmins((prev) => prev.map((a) => a.id === id ? { ...a, role: editRole } : a));
      setEditingId(null);
    } catch { setError("Network error."); }
    finally { setIsSaving(false); }
  }

  async function deleteAdmin(user: AdminUserRecord) {
    if (deletingId) return;
    setDeletingId(user.id);
    try {
      const response = await fetch(`/api/admin/admin-users/${user.id}`, { method: "DELETE" });
      const result = await response.json().catch(() => null);
      if (!response.ok) { setError(result?.error ?? "Failed to delete."); return; }
      setAdmins((prev) => prev.filter((a) => a.id !== user.id));
    } catch { setError("Network error."); }
    finally { setDeletingId(null); setPendingDelete(null); }
  }

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setIsAdding(true);
    try {
      const response = await fetch("/api/admin/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) { setAddError(result?.error ?? "Failed to create admin."); return; }
      setAdmins((prev) => [...prev, result.admin]);
      setShowAddModal(false);
      setAddForm({ display_name: "", email: "", password: "", role: "admin" });
    } catch { setAddError("Network error."); }
    finally { setIsAdding(false); }
  }

  function openEditRolePerm(role: AdminRole) {
    const perm = getRolePerm(role);
    setEditingRole(role);
    setEditPermDescription(perm.description);
    setEditPermList([...perm.permissions]);
    setNewPermItem("");
  }

  function addPermItem() {
    const trimmed = newPermItem.trim();
    if (trimmed && !editPermList.includes(trimmed)) {
      setEditPermList([...editPermList, trimmed]);
    }
    setNewPermItem("");
  }

  function removePermItem(index: number) {
    setEditPermList(editPermList.filter((_, i) => i !== index));
  }

  async function saveRolePerms() {
    if (!editingRole) return;
    setError("");
    setIsSavingPerms(true);
    try {
      const response = await fetch("/api/admin/role-permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editingRole,
          description: editPermDescription,
          permissions: editPermList,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) { setError(result?.error ?? "Failed to save permissions."); return; }
      setRolePerms((prev) => {
        const filtered = prev.filter((rp) => rp.role !== editingRole);
        return [...filtered, {
          role: editingRole,
          description: editPermDescription,
          permissions: editPermList,
          updated_at: new Date().toISOString(),
        }];
      });
      setEditingRole(null);
    } catch { setError("Network error."); }
    finally { setIsSavingPerms(false); }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <AdminPageHeader
        breadcrumbs={[{ label: "System" }, { label: "Admin Accounts", active: true }]}
        title="Admin Accounts"
        description="Manage admin user roles and permissions."
        actions={isSuperAdmin ? (
          <AdminButton onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add Admin
          </AdminButton>
        ) : undefined}
      />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-[#172554] bg-[#0F172A] p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Total Admins</p>
          <p className="mt-2 text-3xl font-black text-white">{admins.length}</p>
          <p className="mt-1 text-xs text-[#64748B]">Registered accounts</p>
        </div>
        <div className="rounded-xl border border-[#172554] bg-[#0F172A] p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Super Admins</p>
          <p className="mt-2 text-3xl font-black text-white">{admins.filter((a) => a.role === "super_admin").length}</p>
          <p className="mt-1 text-xs text-[#64748B]">Full access accounts</p>
        </div>
        <div className="rounded-xl border border-[#172554] bg-[#0F172A] p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Your Role</p>
          <span className={`mt-2 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium ${roleColors[isSuperAdmin ? "super_admin" : "admin"]}`}>
            <ShieldCheck size={14} />
            {isSuperAdmin ? "Super Admin" : "Admin"}
          </span>
          <p className="mt-2 text-xs text-[#64748B]">{isSuperAdmin ? "You have full system access" : "Limited to services & orders"}</p>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]">
        <div className="border-b border-[var(--admin-border)] p-6">
          <h2 className="text-lg font-bold text-white">Admin Accounts</h2>
          <p className="mt-1 text-xs text-[#64748B]">All registered admin users and their current roles.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--admin-muted)]">
            <thead className="border-b border-[var(--admin-border)] bg-[var(--admin-surface-header)] text-xs font-semibold uppercase text-[var(--admin-muted-dark)]">
              <tr>
                <th className="px-6 py-4">NAME</th>
                <th className="px-6 py-4">EMAIL</th>
                <th className="px-6 py-4">ROLE</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4">LAST LOGIN</th>
                <th className="px-6 py-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-border)]">
              {admins.length === 0 ? (
                <tr><td className="px-6 py-8 text-center text-[var(--admin-muted)]" colSpan={6}>No admin accounts.</td></tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="transition-colors hover:bg-[#111827]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8B5CF6]/20 text-sm font-bold text-[#8B5CF6]">
                          {admin.display_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white">{admin.display_name}</p>
                          {admin.id === currentAdminId && <p className="text-[10px] text-[#64748B]">(you)</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#94A3B8]">{admin.email}</td>
                    <td className="px-6 py-4">
                      {editingId === admin.id && isSuperAdmin ? (
                        <div className="flex items-center gap-2">
                          <select
                            className={adminSelectClass}
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as AdminRole)}
                          >
                            <option value="super_admin">Super Admin</option>
                            <option value="admin">Admin</option>
                            <option value="support">Support</option>
                          </select>
                          <AdminButton type="button" onClick={() => saveRole(admin.id)} disabled={isSaving} className="!py-1 !px-2 text-xs">Save</AdminButton>
                          <AdminButton type="button" variant="secondary" onClick={() => setEditingId(null)} className="!py-1 !px-2 text-xs">Cancel</AdminButton>
                        </div>
                      ) : (
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleColors[admin.role]}`}>
                          <ShieldCheck size={12} />
                          {roleLabels[admin.role]}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${admin.status === "active" ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${admin.status === "active" ? "bg-green-400" : "bg-amber-400"}`} />
                        {admin.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#94A3B8]">
                      {admin.last_sign_in_at ? new Date(admin.last_sign_in_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {isSuperAdmin && (
                          <button
                            onClick={() => { setEditingId(admin.id); setEditRole(admin.role); }}
                            className="admin-action-icon hover:border-[#22D3EE] hover:text-[#22D3EE]"
                            aria-label="Edit role"
                          >
                            <UserCog size={16} />
                          </button>
                        )}
                        {isSuperAdmin && admin.id !== currentAdminId && (
                          <button
                            onClick={() => setPendingDelete(admin)}
                            className="admin-action-icon hover:border-red-500/30 hover:text-red-300"
                            aria-label="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        {!isSuperAdmin && (
                          <span className="text-xs text-[#64748B]">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {(Object.entries(roleLabels) as [AdminRole, string][]).map(([role, label]) => {
          const perm = getRolePerm(role);
          const isEditing = editingRole === role;

          return (
            <div key={role} className="rounded-xl border border-[#172554] bg-[#0F172A] p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${roleAccentBorder[role]} ${roleAccentBg[role]}`}>
                    <Shield size={18} className={roleAccentText[role]} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{label}</h3>
                    <p className="text-xs text-[#64748B]">{admins.filter((a) => a.role === role).length} user{admins.filter((a) => a.role === role).length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                {isSuperAdmin && !isEditing && (
                  <button
                    onClick={() => openEditRolePerm(role)}
                    className="admin-action-icon hover:border-[#22D3EE] hover:text-[#22D3EE]"
                    aria-label={`Edit ${label} permissions`}
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-1">Description</label>
                    <input
                      className={adminInputClass}
                      value={editPermDescription}
                      onChange={(e) => setEditPermDescription(e.target.value)}
                      placeholder="Role description"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-2 font-semibold text-white">Allowed Access</label>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-lg border border-[#172554] bg-[#050816] p-4">
                      {AVAILABLE_PERMISSIONS.map((avail) => {
                        const isChecked = editPermList.includes(avail.key);
                        return (
                          <label key={avail.key} className="flex items-center gap-2 text-xs text-[#94A3B8] cursor-pointer hover:text-white transition-colors">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditPermList([...editPermList, avail.key]);
                                } else {
                                  setEditPermList(editPermList.filter((k) => k !== avail.key));
                                }
                              }}
                              className="rounded border-[var(--admin-border)] bg-[var(--admin-field)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)] h-4 w-4"
                            />
                            {avail.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <AdminButton type="button" onClick={saveRolePerms} disabled={isSavingPerms} className="!py-1.5 !px-3 text-xs">
                      <Check size={14} />
                      Save
                    </AdminButton>
                    <AdminButton type="button" variant="secondary" onClick={() => setEditingRole(null)} className="!py-1.5 !px-3 text-xs">Cancel</AdminButton>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm leading-relaxed text-[#94A3B8]">{perm.description || roleLabels[role]}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {perm.permissions.map((p, i) => (
                      <span
                        key={i}
                        className={`rounded-md border px-2 py-1 text-[11px] ${roleTagBg[role]}`}
                      >
                        {permissionLabels[p] || p}
                      </span>
                    ))}
                    {perm.permissions.length === 0 && (
                      <span className="text-[11px] text-[#64748B]">No permissions defined</span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Remove Admin Account"
        description={pendingDelete ? `Remove "${pendingDelete.display_name}" (${pendingDelete.email}) from admin accounts? This cannot be undone.` : ""}
        confirmLabel="Remove"
        variant="danger"
        isLoading={Boolean(deletingId)}
        onClose={() => { if (!deletingId) setPendingDelete(null); }}
        onConfirm={() => { if (pendingDelete) deleteAdmin(pendingDelete); }}
      />

      {showAddModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-4">
          <div className="w-full max-w-md rounded-xl border border-[#172554] bg-[#0F172A] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Add Admin Account</h2>
              <button
                onClick={() => { setShowAddModal(false); setAddError(""); }}
                className="text-[#64748B] hover:text-white"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddAdmin} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1">Display Name</label>
                <input
                  className={adminInputClass}
                  value={addForm.display_name}
                  onChange={(e) => setAddForm({ ...addForm, display_name: e.target.value })}
                  required
                  placeholder="e.g. Admin Beta"
                />
              </div>
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1">Email</label>
                <input
                  className={adminInputClass}
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  required
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1">Password</label>
                <div className="relative">
                  <input
                    className={adminInputClass + " pr-10"}
                    type={showPassword ? "text" : "password"}
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    required
                    minLength={8}
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1">Role</label>
                <select
                  className={adminSelectClass}
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value as AdminRole })}
                >
                  <option value="admin">Admin</option>
                  <option value="support">Support</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              {addError && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                  {addError}
                </p>
              )}
              <div className="flex items-center justify-end gap-3 pt-2">
                <AdminButton type="button" variant="secondary" onClick={() => { setShowAddModal(false); setAddError(""); }}>
                  Cancel
                </AdminButton>
                <AdminButton type="submit" disabled={isAdding}>
                  {isAdding ? "Creating..." : "Create Admin"}
                </AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
