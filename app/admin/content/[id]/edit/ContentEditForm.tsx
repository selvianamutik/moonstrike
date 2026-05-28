"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminFormField, adminInputClass, adminSelectClass, adminTextareaClass } from "@/components/admin/AdminFormField";
import { adminGames, type AdminContent } from "@/lib/admin-mock";

export function ContentEditForm({ content }: { content: AdminContent }) {
  const router = useRouter();

  const title = content.tab === "media" ? content.filename : content.title;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={[
          { label: "Management" },
          { label: "Content", href: "/admin/content" },
          { label: "Edit", active: true },
        ]}
        title={`Edit: ${title}`}
      />
      <form
        className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6 flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          router.push("/admin/content");
        }}
      >
        {content.tab === "landing" && content.blockType === "hero" && (
          <>
            <AdminFormField label="Label">
              <input className={adminInputClass} defaultValue="Season Launch" />
            </AdminFormField>
            <AdminFormField label="Headline">
              <input className={adminInputClass} defaultValue="Dominate the Game." />
            </AdminFormField>
            <AdminFormField label="Subtext">
              <textarea className={adminTextareaClass} defaultValue="Premium boosting for competitive players." />
            </AdminFormField>
            <AdminFormField label="CTA text / link">
              <input className={adminInputClass} defaultValue="Browse Services → /services" />
            </AdminFormField>
            <AdminFormField label="Background image">
              <div className="border-2 border-dashed border-[var(--ms-accent)] rounded-lg p-6 text-center text-sm text-[var(--ms-text-secondary)]">
                From Media Library
              </div>
            </AdminFormField>
          </>
        )}

        {content.tab === "landing" && content.blockType === "stats_bar" && (
          <>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="grid grid-cols-2 gap-3">
                <AdminFormField label={`Stat ${n} value`}>
                  <input className={adminInputClass} defaultValue={n === 1 ? "50K+" : "99.9%"} />
                </AdminFormField>
                <AdminFormField label={`Stat ${n} label`}>
                  <input className={adminInputClass} defaultValue={n === 1 ? "Gamers served" : "Success rate"} />
                </AdminFormField>
              </div>
            ))}
          </>
        )}

        {content.tab === "landing" && content.blockType === "benefits_section" && (
          <>
            <AdminFormField label="Media (image/video)">
              <div className="border-2 border-dashed border-[var(--ms-accent)] rounded-lg p-6 text-center text-sm text-[var(--ms-text-secondary)]">
                Upload or pick from Media Library
              </div>
            </AdminFormField>
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-3 border border-[var(--ms-accent)] rounded-lg space-y-2">
                <input className={adminInputClass} placeholder="Icon name (Tabler)" />
                <input className={adminInputClass} placeholder="Benefit title" />
                <textarea className={adminTextareaClass} placeholder="Description" />
              </div>
            ))}
          </>
        )}

        {content.tab === "landing" && content.blockType === "steps_section" && (
          <>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="space-y-2">
                <AdminFormField label={`Step ${n} title`}>
                  <input className={adminInputClass} />
                </AdminFormField>
                <AdminFormField label={`Step ${n} description`}>
                  <textarea className={adminTextareaClass} rows={2} />
                </AdminFormField>
              </div>
            ))}
          </>
        )}

        {content.tab === "banners" && (
          <>
            <AdminFormField label="Banner title">
              <input className={adminInputClass} defaultValue={"title" in content ? content.title : ""} />
            </AdminFormField>
            <AdminFormField label="Game (optional)">
              <select className={adminSelectClass}>
                <option value="">Regional default (all games)</option>
                {adminGames.map((g) => (
                  <option key={g.slug} value={g.slug}>
                    {g.name}
                  </option>
                ))}
              </select>
            </AdminFormField>
            <AdminFormField label="Image">
              <div className="border-2 border-dashed border-[var(--ms-accent)] rounded-lg p-6 text-center text-sm text-[var(--ms-text-secondary)]">
                Select from Media Library
              </div>
            </AdminFormField>
            <AdminFormField label="Region">
              <select className={adminSelectClass} defaultValue="Both">
                <option>USA</option>
                <option>EUROPE</option>
                <option>Both</option>
              </select>
            </AdminFormField>
            <AdminFormField label="CTA link (optional)">
              <input className={adminInputClass} placeholder="https://..." />
            </AdminFormField>
            <AdminFormField label="Schedule date">
              <input type="date" className={adminInputClass} />
            </AdminFormField>
          </>
        )}

        {content.tab === "media" && (
          <>
            <AdminFormField label="Filename">
              <input className={adminInputClass} defaultValue={"filename" in content ? content.filename : ""} readOnly />
            </AdminFormField>
            <AdminFormField label="Upload">
              <div className="border-2 border-dashed border-[var(--ms-accent)] rounded-lg p-8 text-center text-sm text-[var(--ms-text-secondary)]">
                Drag & drop — served via Cloudflare CDN
              </div>
            </AdminFormField>
            {"usedIn" in content && (
              <p className="text-sm text-[var(--ms-text-secondary)]">
                Used in {content.usedIn} place(s). Delete blocked while in use.
              </p>
            )}
          </>
        )}

        <AdminFormField label="Status">
          <select className={adminSelectClass} defaultValue={content.status}>
            <option value="active">active</option>
            <option value="scheduled">scheduled</option>
            <option value="draft">draft</option>
          </select>
        </AdminFormField>

        <div className="flex gap-3">
          <AdminButton type="submit">Save Content</AdminButton>
          <AdminButton href="/admin/content" variant="secondary">
            Cancel
          </AdminButton>
        </div>
      </form>
    </div>
  );
}
