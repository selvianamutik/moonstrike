"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminFormField, adminInputClass, adminSelectClass, adminTextareaClass } from "@/components/admin/AdminFormField";
import { CANONICAL_GAME_GENRES, GAME_PLATFORMS } from "@/lib/admin-constants";
import type { AdminGame } from "@/lib/admin-mock";

export function EditGameForm({ game }: { game: AdminGame }) {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Games", href: "/admin/games" }, { label: "Edit", active: true }]}
        title={`Edit: ${game.name}`}
      />
      <form
        className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6 flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          router.push("/admin/games");
        }}
      >
        <AdminFormField label="Game Name">
          <input className={adminInputClass} defaultValue={game.name} required />
        </AdminFormField>
        <AdminFormField label="Slug">
          <input className={adminInputClass + " opacity-60"} defaultValue={game.slug} readOnly />
        </AdminFormField>
        <AdminFormField label="Genre / Type">
          <select className={adminSelectClass} defaultValue={game.canonicalGenre}>
            {CANONICAL_GAME_GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </AdminFormField>
        <AdminFormField label="Platform">
          <select className={adminSelectClass} defaultValue={game.displayPlatform}>
            {GAME_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </AdminFormField>
        <AdminFormField label="Description">
          <textarea className={adminTextareaClass} defaultValue={game.description} />
        </AdminFormField>
        <AdminFormField label="Status">
          <select className={adminSelectClass} defaultValue={game.status}>
            <option value="active">active</option>
            <option value="draft">draft</option>
            <option value="archived">archived</option>
          </select>
        </AdminFormField>
        <div className="flex gap-3">
          <AdminButton type="submit">Save Changes</AdminButton>
          <AdminButton href="/admin/games" variant="secondary">
            Cancel
          </AdminButton>
        </div>
      </form>
    </div>
  );
}
