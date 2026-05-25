"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminFormField, adminInputClass, adminSelectClass, adminTextareaClass } from "@/components/admin/AdminFormField";
import { CANONICAL_GAME_GENRES, GAME_PLATFORMS } from "@/lib/admin-constants";

export default function NewGamePage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Games", href: "/admin/games" }, { label: "New", active: true }]}
        title="Add New Game"
      />
      <form
        className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6 flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          router.push("/admin/games");
        }}
      >
        <AdminFormField label="Game Name">
          <input className={adminInputClass} required />
        </AdminFormField>
        <AdminFormField label="Slug">
          <input className={adminInputClass} required />
        </AdminFormField>
        <AdminFormField label="Genre / Type">
          <select className={adminSelectClass}>
            {CANONICAL_GAME_GENRES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </AdminFormField>
        <AdminFormField label="Platform">
          <select className={adminSelectClass}>
            {GAME_PLATFORMS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </AdminFormField>
        <AdminFormField label="Description">
          <textarea className={adminTextareaClass} />
        </AdminFormField>
        <AdminFormField label="Thumbnail">
          <div className="border-2 border-dashed border-[var(--ms-accent)] rounded-lg p-6 text-center text-sm text-[var(--ms-text-secondary)]">
            Upload 600×400 (3:2) — JPG/PNG
          </div>
        </AdminFormField>
        <AdminFormField label="Status">
          <select className={adminSelectClass} defaultValue="active">
            <option value="active">active</option>
            <option value="draft">draft</option>
            <option value="archived">archived</option>
          </select>
        </AdminFormField>
        <div className="flex gap-3">
          <AdminButton type="submit">Save Game</AdminButton>
          <AdminButton href="/admin/games" variant="secondary">
            Cancel
          </AdminButton>
        </div>
      </form>
    </div>
  );
}
