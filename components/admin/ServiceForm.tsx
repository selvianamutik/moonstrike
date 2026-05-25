"use client";

import React, { useState } from "react";
import { Cloud, Plus, Trash2, Lightbulb } from "lucide-react";
import { AdminFormField, adminInputClass, adminSelectClass, adminTextareaClass } from "@/components/admin/AdminFormField";
import { AdminButton } from "@/components/admin/AdminButton";
import { adminGames } from "@/lib/admin-mock";
import { SERVICE_BADGE_OPTIONS, SERVICE_CATEGORIES } from "@/lib/admin-constants";
import type { AdminService } from "@/lib/admin-mock";

type OptionField = {
  id: string;
  label: string;
  type: "single" | "multiple" | "scalar";
  required: boolean;
  priceUsd?: string;
  priceEur?: string;
};

type BenefitRow = { id: string; icon: string; title: string; description: string };

type ServiceFormProps = {
  initial?: Partial<AdminService>;
  readOnly?: boolean;
  onDiscard?: () => void;
  onSubmit?: () => void;
};

export function ServiceForm({ initial, readOnly = false, onDiscard, onSubmit }: ServiceFormProps) {
  const [customFields, setCustomFields] = useState<OptionField[]>([
    { id: "1", label: "Current Rank", type: "single", required: true, priceUsd: "0", priceEur: "0" },
    { id: "2", label: "Target Rank", type: "single", required: true, priceUsd: "60", priceEur: "55" },
  ]);
  const [benefits, setBenefits] = useState<BenefitRow[]>([
    { id: "b1", icon: "tabler-bolt", title: "Fast Start", description: "Booster assigned shortly after checkout." },
    { id: "b2", icon: "tabler-chart-line", title: "Clear Progress", description: "Tracked milestones through delivery." },
  ]);
  const [requirements, setRequirements] = useState<string[]>([
    "Active game account with access to selected content.",
    "Correct region selected before checkout.",
  ]);
  const [selectedBadges, setSelectedBadges] = useState<string[]>(initial?.badges ?? []);

  function toggleBadge(badge: string) {
    if (readOnly) return;
    setSelectedBadges((prev) => (prev.includes(badge) ? prev.filter((b) => b !== badge) : [...prev, badge]));
  }

  return (
    <div className="flex flex-col gap-6">
      {!readOnly && (
        <div className="flex items-center justify-end gap-3">
          <AdminButton variant="secondary" onClick={onDiscard}>
            Discard
          </AdminButton>
          <AdminButton type="button" onClick={onSubmit}>
            Deploy Service
          </AdminButton>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <section className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Basic Info</h2>
            <div className="grid gap-4">
              <AdminFormField label="Service Name">
                <input className={adminInputClass} defaultValue={initial?.name} readOnly={readOnly} />
              </AdminFormField>
              <AdminFormField label="Game">
                <select className={adminSelectClass} defaultValue={initial?.gameSlug} disabled={readOnly}>
                  {adminGames.map((g) => (
                    <option key={g.slug} value={g.slug}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </AdminFormField>
              <AdminFormField label="Service Category">
                <select className={adminSelectClass} defaultValue={initial?.serviceCategory} disabled={readOnly}>
                  {SERVICE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </AdminFormField>
              <label className="flex items-center gap-2 text-sm text-[var(--ms-text-secondary)]">
                <input type="checkbox" defaultChecked={initial?.isHotOffer} disabled={readOnly} />
                Hot Offer (sets isHotOffer + hotOfferAt timestamp on save)
              </label>
              <AdminFormField label="Region">
                <div className="flex flex-wrap gap-4">
                  {(["USA", "EUROPE"] as const).map((r) => (
                    <label key={r} className="flex items-center gap-2 text-sm text-white">
                      <input type="checkbox" defaultChecked disabled={readOnly} />
                      {r}
                    </label>
                  ))}
                  <label className="flex items-center gap-2 text-sm text-white">
                    <input type="checkbox" disabled={readOnly} />
                    Both
                  </label>
                </div>
              </AdminFormField>
            </div>
          </section>

          <section className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Service Badges</h2>
            <div className="flex flex-wrap gap-2">
              {SERVICE_BADGE_OPTIONS.map((badge) => (
                <button
                  key={badge}
                  type="button"
                  onClick={() => toggleBadge(badge)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    selectedBadges.includes(badge)
                      ? "bg-[#8B5CF6] border-[#8B5CF6] text-white"
                      : "border-[var(--ms-accent)] text-[var(--ms-text-secondary)] hover:border-[#8B5CF6]"
                  }`}
                >
                  {badge}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Custom Service Options</h2>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() =>
                    setCustomFields((p) => [...p, { id: String(Date.now()), label: "", type: "single", required: false }])
                  }
                  className="flex items-center gap-1 text-sm text-[#22D3EE]"
                >
                  <Plus size={14} /> ADD NEW FIELD
                </button>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {customFields.map((field) => (
                <div key={field.id} className="p-3 bg-[var(--ms-primary)] rounded-lg border border-[var(--ms-accent)] space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <input className={`${adminInputClass} flex-1 min-w-[140px]`} defaultValue={field.label} readOnly={readOnly} placeholder="Label" />
                    <select className={`${adminSelectClass} w-36`} defaultValue={field.type} disabled={readOnly}>
                      <option value="single">Single Choice</option>
                      <option value="multiple">Multiple Choice</option>
                      <option value="scalar">Scalar</option>
                    </select>
                    <label className="flex items-center gap-2 text-xs text-[var(--ms-text-secondary)]">
                      <input type="checkbox" defaultChecked={field.required} disabled={readOnly} />
                      Required
                    </label>
                    {!readOnly && (
                      <button type="button" onClick={() => setCustomFields((p) => p.filter((f) => f.id !== field.id))} className="ml-auto text-red-400">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input className={adminInputClass} placeholder="$ USD modifier" readOnly={readOnly} />
                    <input className={adminInputClass} placeholder="€ EUR modifier" readOnly={readOnly} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">What You Get</h2>
              {!readOnly && benefits.length < 4 && (
                <button
                  type="button"
                  onClick={() =>
                    setBenefits((p) => [...p, { id: String(Date.now()), icon: "tabler-star", title: "", description: "" }])
                  }
                  className="text-sm text-[#22D3EE]"
                >
                  + Add benefit
                </button>
              )}
            </div>
            <div className="space-y-3">
              {benefits.map((b) => (
                <div key={b.id} className="grid gap-2 p-3 border border-[var(--ms-accent)] rounded-lg bg-[var(--ms-primary)]">
                  <input className={adminInputClass} defaultValue={b.icon} placeholder="Tabler icon name" readOnly={readOnly} />
                  <input className={adminInputClass} defaultValue={b.title} placeholder="Title" readOnly={readOnly} />
                  <textarea className={adminTextareaClass} defaultValue={b.description} placeholder="Description" readOnly={readOnly} />
                </div>
              ))}
            </div>
          </section>

          <section className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Requirements</h2>
              {!readOnly && (
                <button type="button" onClick={() => setRequirements((p) => [...p, ""])} className="text-sm text-[#22D3EE]">
                  + Add row
                </button>
              )}
            </div>
            {requirements.map((req, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input className={adminInputClass} defaultValue={req} readOnly={readOnly} />
                {!readOnly && (
                  <button type="button" onClick={() => setRequirements((p) => p.filter((_, j) => j !== i))} className="text-red-400 p-2">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </section>

          <section className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Service Details</h2>
            {!readOnly && (
              <div className="flex gap-2 mb-3 pb-3 border-b border-[var(--ms-accent)]">
                {["B", "I", "•", "Link"].map((t) => (
                  <button key={t} type="button" className="px-2 py-1 text-xs border border-[var(--ms-accent)] rounded text-[var(--ms-text-secondary)]">
                    {t}
                  </button>
                ))}
              </div>
            )}
            <textarea className={adminTextareaClass + " min-h-[160px]"} defaultValue={initial?.description} readOnly={readOnly} />
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Pricing</h2>
            <AdminFormField label="Base Price (USD)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ms-text-secondary)]">$</span>
                <input type="number" className={adminInputClass + " pl-8"} defaultValue={initial?.basePriceUsd} readOnly={readOnly} />
              </div>
            </AdminFormField>
            <AdminFormField label="Base Price (EUR)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ms-text-secondary)]">€</span>
                <input type="number" className={adminInputClass + " pl-8"} defaultValue={initial?.basePriceEur} readOnly={readOnly} />
              </div>
            </AdminFormField>
          </section>

          <section className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Thumbnail</h2>
            <div className="border-2 border-dashed border-[var(--ms-accent)] rounded-xl p-8 text-center">
              <Cloud size={32} className="text-[var(--ms-text-secondary)] mx-auto mb-2" />
              <p className="text-sm text-[var(--ms-text-secondary)]">Drag & drop or click to upload</p>
              <p className="text-xs text-[var(--ms-text-secondary)] mt-1">Recommended 1200×1080 (JPG/PNG)</p>
            </div>
          </section>

          <section className="bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 rounded-xl p-4">
            <div className="flex gap-2">
              <Lightbulb size={18} className="text-[#8B5CF6] shrink-0" />
              <p className="text-xs text-[var(--ms-text-secondary)]">
                Enable &quot;Play with Pro&quot; for duo services — customers prefer playing alongside their booster.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
