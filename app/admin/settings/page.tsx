"use client";

import React, { useState } from "react";
import { User, Settings2, RotateCcw } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminFormField, adminInputClass, adminSelectClass } from "@/components/admin/AdminFormField";

export default function SettingsPage() {
  const [sessionHours, setSessionHours] = useState("8");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={[{ label: "System" }, { label: "Settings", active: true }]}
        title="Terminal Configuration"
        description="Manage platform-wide settings and administrative preferences."
      />

      <section className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/20 flex items-center justify-center">
            <User size={16} className="text-[#8B5CF6]" />
          </div>
          <h2 className="text-lg font-bold text-white">Profile Settings</h2>
        </div>

        <div className="flex items-start gap-6 mb-6">
          <div className="w-20 h-20 rounded-full bg-[var(--ms-accent)] border-2 border-[#22D3EE]/30 flex items-center justify-center text-2xl font-bold text-white">
            AA
          </div>
          <div>
            <AdminButton variant="primary" className="mb-2">
              Upload New Avatar
            </AdminButton>
            <p className="text-xs text-[#64748B]">JPG, PNG or GIF. Max size of 800K.</p>
          </div>
        </div>

        <div className="grid gap-4 mb-4">
          <AdminFormField label="Admin Display Name">
            <input className={adminInputClass} defaultValue="Admin Alpha" />
          </AdminFormField>
          <AdminFormField label="Email Address">
            <input className={adminInputClass} defaultValue="alpha@moonstrike.admin" type="email" />
          </AdminFormField>
        </div>

        <button type="button" className="flex items-center gap-2 text-sm text-[#8B5CF6] hover:text-[#A78BFA]">
          <RotateCcw size={14} />
          Change Security Password
        </button>
      </section>

      <section className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[#22D3EE]/20 flex items-center justify-center">
            <Settings2 size={16} className="text-[#22D3EE]" />
          </div>
          <h2 className="text-lg font-bold text-white">Application Settings</h2>
        </div>

        <AdminFormField label="Session timeout duration">
          <select
            className={adminSelectClass}
            value={sessionHours}
            onChange={(e) => setSessionHours(e.target.value)}
          >
            <option value="8">8 hours (default)</option>
            <option value="4">4 hours</option>
            <option value="12">12 hours</option>
            <option value="24">24 hours</option>
          </select>
          <p className="text-xs text-[var(--ms-text-secondary)] mt-2">
            Inactivity timeout before redirect to login. Remember-terminal extends JWT to 30 days on login.
          </p>
        </AdminFormField>
      </section>

      <div className="flex items-center gap-3">
        <AdminButton onClick={handleSave}>Save All Changes</AdminButton>
        <AdminButton variant="secondary">Discard</AdminButton>
        {saved && <span className="text-sm text-green-500">Settings saved (mock)</span>}
      </div>
    </div>
  );
}
