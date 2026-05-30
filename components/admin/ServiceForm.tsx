"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { AdminFormField, adminInputClass, adminSelectClass, adminTextareaClass } from "@/components/admin/AdminFormField";
import { AdminButton } from "@/components/admin/AdminButton";
import { SERVICE_BADGE_OPTIONS } from "@/lib/admin-constants";
import type { GameRow } from "@/lib/cms/games";
import type { ServiceCategoryRow } from "@/lib/cms/service-categories";
import type { ServiceBenefit, ServiceOption, ServiceRow } from "@/lib/cms/services";

function loadImage(file: Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read image."));
    };
    image.src = url;
  });
}

async function resizeToWebp(file: File, maxWidth: number, quality: number) {
  const image = await loadImage(file);
  const scale = Math.min(1, maxWidth / image.naturalWidth);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) throw new Error("Browser image compression is unavailable.");

  context.drawImage(image, 0, 0, width, height);

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to compress image."));
          return;
        }

        resolve(new File([blob], "service-image.webp", { type: "image/webp" }));
      },
      "image/webp",
      quality
    );
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function emptyBenefit(): ServiceBenefit {
  return { icon: "tabler-star", title: "", description: "" };
}

function emptyOption(): ServiceOption {
  return {
    label: "",
    type: "single_choice",
    required: true,
    options: [{ label: "", priceUSD: 0, priceEUR: 0 }],
  };
}

function emptyChoice() {
  return { label: "", priceUSD: 0, priceEUR: 0 };
}

export function ServiceForm({
  categories,
  games,
  service,
}: {
  categories: ServiceCategoryRow[];
  games: GameRow[];
  service?: ServiceRow;
}) {
  const router = useRouter();
  const isEditing = Boolean(service);
  const [title, setTitle] = useState(service?.title ?? "");
  const [slug, setSlug] = useState(service?.slug ?? "");
  const [gameId, setGameId] = useState(service?.game_id ?? games[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(service?.service_category_id ?? "");
  const [status, setStatus] = useState(service?.status ?? "draft");
  const [isHotOffer, setIsHotOffer] = useState(service?.is_hot_offer ?? false);
  const [regions, setRegions] = useState<string[]>(service?.region ?? ["USA", "EUROPE"]);
  const [badges, setBadges] = useState<string[]>(service?.badges ?? []);
  const [description, setDescription] = useState(service?.description ?? "");
  const [basePriceUSD, setBasePriceUSD] = useState(String(service?.base_price_usd ?? 0));
  const [basePriceEUR, setBasePriceEUR] = useState(String(service?.base_price_eur ?? 0));
  const [image, setImage] = useState(service?.image ?? "");
  const [requirements, setRequirements] = useState<string[]>(
    service?.requirements.length ? service.requirements : [""]
  );
  const [benefits, setBenefits] = useState<ServiceBenefit[]>(
    service?.what_you_get.length ? service.what_you_get : [emptyBenefit()]
  );
  const [optionsSchema, setOptionsSchema] = useState<ServiceOption[]>(service?.options_schema ?? []);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const availableCategories = useMemo(
    () => categories.filter((category) => category.game_id === gameId),
    [categories, gameId]
  );

  function toggleRegion(region: string) {
    setRegions((current) =>
      current.includes(region)
        ? current.filter((item) => item !== region)
        : [...current, region]
    );
  }

  function toggleBadge(badge: string) {
    setBadges((current) =>
      current.includes(badge)
        ? current.filter((item) => item !== badge)
        : [...current, badge]
    );
  }

  function updateOption(index: number, patch: Partial<ServiceOption>) {
    setOptionsSchema((current) =>
      current.map((option, optionIndex) => {
        if (optionIndex !== index) return option;

        const next = { ...option, ...patch };

        if (patch.type === "scalar") {
          return {
            ...next,
            options: undefined,
            min: next.min ?? 1,
            max: next.max ?? 10,
            pricePerUnitUSD: next.pricePerUnitUSD ?? 0,
            pricePerUnitEUR: next.pricePerUnitEUR ?? 0,
          };
        }

        if (patch.type === "single_choice" || patch.type === "multiple_choice") {
          return {
            ...next,
            options: next.options?.length ? next.options : [emptyChoice()],
            min: undefined,
            max: undefined,
            pricePerUnitUSD: undefined,
            pricePerUnitEUR: undefined,
          };
        }

        return next;
      })
    );
  }

  function updateChoice(optionIndex: number, choiceIndex: number, patch: Partial<{ label: string; priceUSD: number; priceEUR: number }>) {
    setOptionsSchema((current) =>
      current.map((option, currentOptionIndex) => {
        if (currentOptionIndex !== optionIndex) return option;

        const choices = option.options?.length ? option.options : [emptyChoice()];

        return {
          ...option,
          options: choices.map((choice, currentChoiceIndex) =>
            currentChoiceIndex === choiceIndex ? { ...choice, ...patch } : choice
          ),
        };
      })
    );
  }

  async function uploadImage(file: File) {
    setError("");
    setIsUploading(true);

    try {
      const compressed = await resizeToWebp(file, 1400, 0.82);
      const formData = new FormData();
      formData.set("slug", slug || slugify(title) || "service");
      formData.set("image", compressed);

      const response = await fetch("/api/admin/services/image", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json().catch(() => null)) as {
        imageUrl?: string;
        error?: string;
      } | null;

      if (!response.ok || !result?.imageUrl) {
        setError(result?.error ?? "Unable to upload service image.");
        return;
      }

      setImage(result.imageUrl);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload service image.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    const payload = {
      title,
      slug,
      gameId,
      serviceCategoryId: categoryId || null,
      status,
      isHotOffer,
      region: regions,
      badges,
      description,
      image,
      requirements,
      whatYouGet: benefits.filter((benefit) => benefit.title.trim()),
      basePriceUSD: Number(basePriceUSD),
      basePriceEUR: Number(basePriceEUR),
      optionsSchema,
    };

    try {
      const response = await fetch(isEditing ? `/api/admin/services/${service?.id}` : "/api/admin/services", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(result?.error ?? "Unable to save service.");
        return;
      }

      router.push("/admin/services");
      router.refresh();
    } catch {
      setError("Unable to reach the services endpoint.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex items-center justify-end gap-3">
        <AdminButton type="button" variant="secondary" onClick={() => router.push("/admin/services")}>
          Discard
        </AdminButton>
        <AdminButton type="submit" disabled={isSaving || isUploading}>
          {isUploading ? "Uploading..." : isSaving ? "Saving..." : isEditing ? "Save Service" : "Deploy Service"}
        </AdminButton>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <section className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Basic Info</h2>
            <div className="grid gap-4">
              <AdminFormField label="Service Name">
                <input
                  className={adminInputClass}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!isEditing) setSlug(slugify(e.target.value));
                  }}
                  required
                />
              </AdminFormField>
              <AdminFormField label="Slug">
                <input className={adminInputClass} value={slug} onChange={(e) => setSlug(slugify(e.target.value))} required />
              </AdminFormField>
              <AdminFormField label="Game">
                <select
                  className={adminSelectClass}
                  value={gameId}
                  onChange={(e) => {
                    setGameId(e.target.value);
                    setCategoryId("");
                  }}
                  required
                >
                  {games.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.name}
                    </option>
                  ))}
                </select>
              </AdminFormField>
              <AdminFormField label="Service Category">
                <select className={adminSelectClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">Uncategorised</option>
                  {availableCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.slug})
                    </option>
                  ))}
                </select>
                {availableCategories.length === 0 && (
                  <p className="mt-2 text-xs text-amber-300">No categories yet for this game. Add one from the Services list.</p>
                )}
              </AdminFormField>
              <AdminFormField label="Status">
                <select className={adminSelectClass} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                  <option value="draft">draft</option>
                  <option value="active">active</option>
                  <option value="archived">archived</option>
                </select>
              </AdminFormField>
              <label className="flex items-center gap-2 text-sm text-[var(--ms-text-secondary)]">
                <input type="checkbox" checked={isHotOffer} onChange={(e) => setIsHotOffer(e.target.checked)} />
                Hot Offer
              </label>
              <AdminFormField label="Region">
                <div className="flex flex-wrap gap-4">
                  {["USA", "EUROPE"].map((region) => (
                    <label key={region} className="flex items-center gap-2 text-sm text-white">
                      <input type="checkbox" checked={regions.includes(region)} onChange={() => toggleRegion(region)} />
                      {region}
                    </label>
                  ))}
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
                    badges.includes(badge)
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
              <h2 className="text-lg font-bold text-white">What You Get</h2>
              {benefits.length < 4 && (
                <button type="button" onClick={() => setBenefits((current) => [...current, emptyBenefit()])} className="flex items-center gap-1 text-sm text-[#22D3EE]">
                  <Plus size={14} /> Add benefit
                </button>
              )}
            </div>
            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="grid gap-2 p-3 border border-[var(--ms-accent)] rounded-lg bg-[var(--ms-primary)]">
                  <input
                    className={adminInputClass}
                    value={benefit.icon}
                    onChange={(e) => setBenefits((current) => current.map((item, i) => i === index ? { ...item, icon: e.target.value } : item))}
                    placeholder="tabler-shield"
                  />
                  <input
                    className={adminInputClass}
                    value={benefit.title}
                    onChange={(e) => setBenefits((current) => current.map((item, i) => i === index ? { ...item, title: e.target.value } : item))}
                    placeholder="Title"
                  />
                  <textarea
                    className={adminTextareaClass}
                    value={benefit.description}
                    onChange={(e) => setBenefits((current) => current.map((item, i) => i === index ? { ...item, description: e.target.value } : item))}
                    placeholder="Description"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Requirements</h2>
              <button type="button" onClick={() => setRequirements((current) => [...current, ""])} className="text-sm text-[#22D3EE]">
                + Add row
              </button>
            </div>
            {requirements.map((req, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  className={adminInputClass}
                  value={req}
                  onChange={(e) => setRequirements((current) => current.map((item, i) => i === index ? e.target.value : item))}
                />
                <button type="button" onClick={() => setRequirements((current) => current.filter((_, i) => i !== index))} className="text-red-400 p-2">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </section>

          <section className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Service Details</h2>
            <textarea className={adminTextareaClass + " min-h-[160px]"} value={description} onChange={(e) => setDescription(e.target.value)} />
          </section>

          <section className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Options Builder</h2>
                <p className="mt-1 text-xs text-[var(--ms-text-secondary)]">
                  Build customer-selectable fields shown on the service detail configurator.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOptionsSchema((current) => [...current, emptyOption()])}
                className="flex shrink-0 items-center gap-1 text-sm text-[#22D3EE]"
              >
                <Plus size={14} /> Add option
              </button>
            </div>

            {optionsSchema.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--ms-accent)] bg-[var(--ms-primary)] p-5 text-sm text-[var(--ms-text-secondary)]">
                No configurable options. The service detail page will use the flat base price.
              </div>
            ) : (
              <div className="space-y-4">
                {optionsSchema.map((option, optionIndex) => (
                  <div key={optionIndex} className="rounded-lg border border-[var(--ms-accent)] bg-[var(--ms-primary)] p-4">
                    <div className="grid gap-3 lg:grid-cols-[1fr_190px_120px_auto] lg:items-end">
                      <AdminFormField label="Option Label">
                        <input
                          className={adminInputClass}
                          value={option.label}
                          onChange={(e) => updateOption(optionIndex, { label: e.target.value })}
                          placeholder="Current Rank"
                        />
                      </AdminFormField>
                      <AdminFormField label="Type">
                        <select
                          className={adminSelectClass}
                          value={option.type}
                          onChange={(e) => updateOption(optionIndex, { type: e.target.value as ServiceOption["type"] })}
                        >
                          <option value="single_choice">Single choice</option>
                          <option value="multiple_choice">Multiple choice</option>
                          <option value="scalar">Quantity</option>
                        </select>
                      </AdminFormField>
                      <label className="flex h-11 items-center gap-2 text-sm text-white">
                        <input
                          type="checkbox"
                          checked={option.required}
                          onChange={(e) => updateOption(optionIndex, { required: e.target.checked })}
                        />
                        Required
                      </label>
                      <button
                        type="button"
                        onClick={() => setOptionsSchema((current) => current.filter((_, index) => index !== optionIndex))}
                        className="flex h-11 items-center justify-center rounded-lg border border-red-500/30 px-3 text-red-400 hover:bg-red-500/10"
                        aria-label="Remove option"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {option.type === "scalar" ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-4">
                        <AdminFormField label="Minimum">
                          <input
                            type="number"
                            min="0"
                            className={adminInputClass}
                            value={option.min ?? 1}
                            onChange={(e) => updateOption(optionIndex, { min: Number(e.target.value) })}
                          />
                        </AdminFormField>
                        <AdminFormField label="Maximum">
                          <input
                            type="number"
                            min="0"
                            className={adminInputClass}
                            value={option.max ?? 10}
                            onChange={(e) => updateOption(optionIndex, { max: Number(e.target.value) })}
                          />
                        </AdminFormField>
                        <AdminFormField label="USD / Unit">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className={adminInputClass}
                            value={option.pricePerUnitUSD ?? 0}
                            onChange={(e) => updateOption(optionIndex, { pricePerUnitUSD: Number(e.target.value) })}
                          />
                        </AdminFormField>
                        <AdminFormField label="EUR / Unit">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className={adminInputClass}
                            value={option.pricePerUnitEUR ?? 0}
                            onChange={(e) => updateOption(optionIndex, { pricePerUnitEUR: Number(e.target.value) })}
                          />
                        </AdminFormField>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-[#94A3B8]">Choices</p>
                          <button
                            type="button"
                            onClick={() =>
                              setOptionsSchema((current) =>
                                current.map((item, index) =>
                                  index === optionIndex
                                    ? { ...item, options: [...(item.options ?? []), emptyChoice()] }
                                    : item
                                )
                              )
                            }
                            className="text-sm text-[#22D3EE]"
                          >
                            + Add choice
                          </button>
                        </div>
                        {(option.options ?? []).map((choice, choiceIndex) => (
                          <div key={choiceIndex} className="grid gap-3 md:grid-cols-[1fr_140px_140px_auto] md:items-center">
                            <input
                              className={adminInputClass}
                              value={choice.label}
                              onChange={(e) => updateChoice(optionIndex, choiceIndex, { label: e.target.value })}
                              placeholder="Choice label"
                            />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className={adminInputClass}
                              value={choice.priceUSD}
                              onChange={(e) => updateChoice(optionIndex, choiceIndex, { priceUSD: Number(e.target.value) })}
                              placeholder="USD"
                            />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className={adminInputClass}
                              value={choice.priceEUR}
                              onChange={(e) => updateChoice(optionIndex, choiceIndex, { priceEUR: Number(e.target.value) })}
                              placeholder="EUR"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setOptionsSchema((current) =>
                                  current.map((item, index) =>
                                    index === optionIndex
                                      ? { ...item, options: (item.options ?? []).filter((_, currentChoiceIndex) => currentChoiceIndex !== choiceIndex) }
                                      : item
                                  )
                                )
                              }
                              className="flex h-10 items-center justify-center rounded-lg border border-red-500/30 px-3 text-red-400 hover:bg-red-500/10"
                              aria-label="Remove choice"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Pricing</h2>
            <AdminFormField label="Base Price (USD)">
              <input type="number" min="0" step="0.01" className={adminInputClass} value={basePriceUSD} onChange={(e) => setBasePriceUSD(e.target.value)} />
            </AdminFormField>
            <AdminFormField label="Base Price (EUR)">
              <input type="number" min="0" step="0.01" className={adminInputClass} value={basePriceEUR} onChange={(e) => setBasePriceEUR(e.target.value)} />
            </AdminFormField>
          </section>

          <section className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Thumbnail</h2>
            <AdminFormField label="Service image">
              <div className="space-y-3">
                {image && <img src={image} alt="" className="h-32 w-full rounded-lg object-cover" />}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className={adminInputClass}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage(file);
                  }}
                />
              </div>
            </AdminFormField>
            <p className="text-xs text-[var(--ms-text-secondary)]">
              Recommended: 1400 x 900 px landscape artwork. Uploads are compressed to WebP before storage.
            </p>
          </section>
        </div>
      </div>
    </form>
  );
}
