"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminFormField, adminInputClass } from "@/components/admin/AdminFormField";

export default function NewUserPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Users", href: "/admin/users" }, { label: "New", active: true }]}
        title="Admin Account"
        description="Moon Strike currently uses one seeded admin account only. Public admin registration is disabled."
      />
      <form
        className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6 flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          router.push("/admin/users");
        }}
      >
        <AdminFormField label="Display Name">
          <input className={adminInputClass} required />
        </AdminFormField>
        <AdminFormField label="Email">
          <input type="email" className={adminInputClass} required />
        </AdminFormField>
        <AdminFormField label="Temporary Password">
          <input type="password" className={adminInputClass} required />
        </AdminFormField>
        <p className="text-xs text-[var(--ms-text-secondary)]">Role is always ADMIN. Use npm run admin:reseed to rotate the single admin account credentials.</p>
        <div className="flex gap-3">
          <AdminButton type="submit">Create Admin</AdminButton>
          <AdminButton href="/admin/users" variant="secondary">
            Cancel
          </AdminButton>
        </div>
      </form>
    </div>
  );
}
