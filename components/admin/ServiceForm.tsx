"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminFormField, adminInputClass, adminSelectClass, adminTextareaClass } from "@/components/admin/AdminFormField";
import type { GameRow } from "@/lib/cms/games";
import type { ServiceCategoryRow } from "@/lib/cms/service-categories";
import type { ServiceBenefit, ServiceOption, ServiceRow } from "@/lib/cms/services";

const optionTypes: Array<[ServiceOption["type"], string]> = [
  ["dropdown", "Dropdown"],
  ["radio", "Radio Buttons"],
  ["checkbox_group", "Checkbox Group"],
  ["range", "Range Slider"],
  ["number_stepper", "Number Stepper"],
  ["quantity", "Quantity"],
  ["toggle", "Toggle"],
  ["text", "Short Text"],
  ["textarea", "Long Text"],
];

const sections = [
  ["basic", "Basic Info"],
  ["pricing", "Pricing"],
  ["media", "Image"],
  ["badges", "Badges"],
  ["options", "Options"],
  ["benefits", "What You Get"],
  ["requirements", "Requirements"],
  ["details", "Details"],
] as const;

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
      quality,
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

function emptyChoice() {
  return { label: "", priceUSD: 0, priceEUR: 0 };
}

function addEmptyRow<T>(current: T[], emptyValue: T) {
  return [...current, emptyValue];
}

function emptyOption(): ServiceOption {
  return {
    label: "",
    type: "dropdown",
    required: true,
    options: [emptyChoice()],
  };
}

function isChoiceType(type: ServiceOption["type"]) {
  return type === "dropdown" || type === "radio" || type === "checkbox_group";
}

function isUnitType(type: ServiceOption["type"]) {
  return type === "range" || type === "number_stepper";
}

function isQuantityType(type: ServiceOption["type"]) {
  return type === "quantity";
}

function normalizeLegacyOption(option: ServiceOption): ServiceOption {
  if (option.type === "single_choice") return { ...option, type: "radio" };
  if (option.type === "multiple_choice") return { ...option, type: "checkbox_group" };
  if (option.type === "scalar") return { ...option, type: "number_stepper" };
  return option;
}

function optionPreview(option: ServiceOption) {
  if (isChoiceType(option.type)) {
    const count = option.options?.filter((choice) => choice.label.trim()).length ?? 0;
    return `${count} choice${count === 1 ? "" : "s"}`;
  }

  if (isUnitType(option.type)) {
    return `${option.min ?? 1}-${option.max ?? 10}, USD ${option.pricePerUnitUSD ?? 0} / EUR ${option.pricePerUnitEUR ?? 0}`;
  }

  if (isQuantityType(option.type)) {
    return `multiplies total, ${option.min ?? 1}-${option.max ?? 99}`;
  }

  if (option.type === "toggle") {
    return `${option.disabledLabel ?? "No"} / ${option.enabledLabel ?? "Yes"}, USD ${option.priceUSD ?? 0} / EUR ${option.priceEUR ?? 0}`;
  }

  return option.placeholder ? `placeholder: ${option.placeholder}` : "text input";
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
    service?.requirements.length ? service.requirements : [""],
  );
  const [benefits, setBenefits] = useState<ServiceBenefit[]>(
    service?.what_you_get.length ? service.what_you_get : [emptyBenefit()],
  );
  const [optionsSchema, setOptionsSchema] = useState<ServiceOption[]>(
    () => service?.options_schema.map(normalizeLegacyOption) ?? [],
  );
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const availableCategories = useMemo(
    () =>
      categories
        .filter((category) => category.game_id === gameId)
        .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    [categories, gameId],
  );

  const hasQuantityOption = optionsSchema.some((option) => option.type === "quantity");

  function scrollToSection(id: string) {
    document.getElementById(`service-form-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleRegion(region: string) {
    setRegions((current) =>
      current.includes(region) ? current.filter((item) => item !== region) : [...current, region],
    );
  }

  function normalizeOption(option: ServiceOption, nextType: ServiceOption["type"]): ServiceOption {
    if (isChoiceType(nextType)) {
      return {
        ...option,
        type: nextType,
        options: option.options?.length ? option.options : [emptyChoice()],
        min: undefined,
        max: undefined,
        pricePerUnitUSD: undefined,
        pricePerUnitEUR: undefined,
        priceUSD: undefined,
        priceEUR: undefined,
        placeholder: undefined,
      };
    }

    if (isUnitType(nextType)) {
      return {
        ...option,
        type: nextType,
        options: undefined,
        min: option.min ?? 1,
        max: option.max ?? 10,
        pricePerUnitUSD: option.pricePerUnitUSD ?? 0,
        pricePerUnitEUR: option.pricePerUnitEUR ?? 0,
        priceUSD: undefined,
        priceEUR: undefined,
        placeholder: undefined,
      };
    }

    if (nextType === "toggle") {
      return {
        ...option,
        type: nextType,
        options: undefined,
        min: undefined,
        max: undefined,
        pricePerUnitUSD: undefined,
        pricePerUnitEUR: undefined,
        priceUSD: option.priceUSD ?? 0,
        priceEUR: option.priceEUR ?? 0,
        enabledLabel: option.enabledLabel ?? "Yes",
        disabledLabel: option.disabledLabel ?? "No",
        placeholder: undefined,
      };
    }

    if (isQuantityType(nextType)) {
      return {
        ...option,
        type: nextType,
        options: undefined,
        min: option.min ?? 1,
        max: option.max ?? 99,
        pricePerUnitUSD: undefined,
        pricePerUnitEUR: undefined,
        priceUSD: undefined,
        priceEUR: undefined,
        enabledLabel: undefined,
        disabledLabel: undefined,
        placeholder: undefined,
      };
    }

    return {
      ...option,
      type: nextType,
      options: undefined,
      min: undefined,
      max: undefined,
      pricePerUnitUSD: undefined,
      pricePerUnitEUR: undefined,
      priceUSD: undefined,
      priceEUR: undefined,
      placeholder: option.placeholder ?? "",
    };
  }

  function updateOption(index: number, patch: Partial<ServiceOption>) {
    setOptionsSchema((current) =>
      current.map((option, optionIndex) => {
        if (optionIndex !== index) return option;
        const next = { ...option, ...patch };
        return patch.type ? normalizeOption(next, patch.type) : next;
      }),
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
            currentChoiceIndex === choiceIndex ? { ...choice, ...patch } : choice,
          ),
        };
      }),
    );
  }

  function validateOptions() {
    const quantityCount = optionsSchema.filter((option) => option.type === "quantity").length;

    if (quantityCount > 1) return "Only one Quantity option is allowed per service.";

    for (const [index, option] of optionsSchema.entries()) {
      const optionName = option.label.trim() || `Option ${index + 1}`;

      if (!option.label.trim()) return `Option ${index + 1} needs a label.`;

      if (isChoiceType(option.type)) {
        const choices = option.options ?? [];
        const labels = choices.map((choice) => choice.label.trim()).filter(Boolean);

        if (labels.length === 0) return `${optionName} needs at least one choice.`;
        if (labels.length !== choices.length) return `${optionName} has an empty choice label.`;
        if (new Set(labels.map((label) => label.toLowerCase())).size !== labels.length) {
          return `${optionName} has duplicate choice labels.`;
        }
      }

      if (isUnitType(option.type) || isQuantityType(option.type)) {
        const min = Number(option.min ?? 1);
        const max = Number(option.max ?? min);

        if (!Number.isFinite(min) || !Number.isFinite(max)) return `${optionName} needs valid minimum and maximum values.`;
        if (min < 0 || max < min) return `${optionName} maximum must be greater than or equal to minimum.`;
        if (isQuantityType(option.type) && min < 1) return `${optionName} minimum quantity must be at least 1.`;
      }
    }

    return "";
  }

  async function uploadImage(file: File) {
    setError("");
    setIsUploading(true);

    try {
      const compressed = await resizeToWebp(file, 1400, 0.82);
      const formData = new FormData();
      formData.set("slug", slug || slugify(title) || "service");
      formData.set("image", compressed);

      const response = await fetch("/api/admin/services/image", { method: "POST", body: formData });
      const result = (await response.json().catch(() => null)) as { imageUrl?: string; error?: string } | null;

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

    const validationError = validateOptions();

    if (validationError) {
      setError(validationError);
      document.getElementById("service-form-options")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

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

  const sectionClass = "scroll-mt-28 bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6";

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="lg:sticky lg:top-28 lg:h-fit">
        <div className="rounded-xl border border-[var(--ms-accent)] bg-[var(--ms-secondary)] p-4">
          <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--ms-text-secondary)]">Sections</p>
          <nav className="mt-4 grid gap-1">
            {sections.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollToSection(id)}
                className="rounded-lg px-3 py-2 text-left text-sm text-[#94A3B8] transition-colors hover:bg-[#172554] hover:text-white"
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="sticky top-24 z-20 mb-6 flex flex-col gap-3 rounded-xl border border-[#172554] bg-[#0F172A]/95 p-4 shadow-xl backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-white">{isEditing ? "Editing service" : "Create service"}</p>
            <p className="text-xs text-[#94A3B8]">Actions stay available while you scroll.</p>
          </div>
          <div className="flex gap-3">
            <AdminButton type="button" variant="secondary" onClick={() => router.push("/admin/services")}>
              Discard
            </AdminButton>
            <AdminButton type="submit" disabled={isSaving || isUploading}>
              {isUploading ? "Uploading..." : isSaving ? "Saving..." : isEditing ? "Save Service" : "Deploy Service"}
            </AdminButton>
          </div>
        </div>

        {error && (
          <p className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-6">
          <section id="service-form-basic" className={sectionClass}>
            <h2 className="mb-4 text-lg font-bold text-white">Basic Info</h2>
            <div className="grid gap-4 md:grid-cols-2">
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
              <AdminFormField label="Status">
                <select className={adminSelectClass} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                  <option value="draft">draft</option>
                  <option value="active">active</option>
                  <option value="archived">archived</option>
                </select>
              </AdminFormField>
              <AdminFormField label="Region">
                <div className="flex h-11 flex-wrap items-center gap-4">
                  {["USA", "EUROPE"].map((region) => (
                    <label key={region} className="flex items-center gap-2 text-sm text-white">
                      <input type="checkbox" checked={regions.includes(region)} onChange={() => toggleRegion(region)} />
                      {region}
                    </label>
                  ))}
                </div>
              </AdminFormField>
              <label className="flex items-center gap-2 text-sm text-[var(--ms-text-secondary)] md:col-span-2">
                <input type="checkbox" checked={isHotOffer} onChange={(e) => setIsHotOffer(e.target.checked)} />
                Hot Offer
              </label>
            </div>
          </section>

          <section id="service-form-pricing" className={sectionClass}>
            <h2 className="mb-4 text-lg font-bold text-white">Pricing</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <AdminFormField label="Base Price (USD)">
                <input type="number" min="0" step="0.01" className={adminInputClass} value={basePriceUSD} onChange={(e) => setBasePriceUSD(e.target.value)} />
              </AdminFormField>
              <AdminFormField label="Base Price (EUR)">
                <input type="number" min="0" step="0.01" className={adminInputClass} value={basePriceEUR} onChange={(e) => setBasePriceEUR(e.target.value)} />
              </AdminFormField>
            </div>
          </section>

          <section id="service-form-media" className={sectionClass}>
            <h2 className="mb-4 text-lg font-bold text-white">Image</h2>
            <AdminFormField label="Service image">
              <div className="space-y-3">
                {image && <img src={image} alt="" className="h-40 w-full rounded-lg object-cover" />}
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
            <p className="mt-3 text-xs text-[var(--ms-text-secondary)]">
              Recommended: 1400 x 900 px landscape artwork. Uploads are compressed to WebP before storage.
            </p>
          </section>

          <section id="service-form-badges" className={sectionClass}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-white">Service Badges</h2>
              <button
                type="button"
                onClick={() => setBadges((current) => addEmptyRow(current, ""))}
                className="flex shrink-0 items-center gap-1 text-sm text-[#22D3EE]"
              >
                <Plus size={14} /> Add badge
              </button>
            </div>
            {badges.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[var(--ms-accent)] bg-[var(--ms-primary)] p-5 text-sm text-[var(--ms-text-secondary)]">
                No badges yet. Add short labels like Express, Duo Queue, or Safe Delivery.
              </div>
            ) : (
              <div className="space-y-3">
                {badges.map((badge, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      className={adminInputClass}
                      value={badge}
                      onChange={(e) =>
                        setBadges((current) => current.map((item, itemIndex) => (itemIndex === index ? e.target.value : item)))
                      }
                      placeholder="Badge name"
                    />
                    <button
                      type="button"
                      onClick={() => setBadges((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      className="flex h-11 items-center justify-center rounded-lg border border-red-500/30 px-3 text-red-400 hover:bg-red-500/10"
                      aria-label="Remove badge"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section id="service-form-options" className={sectionClass}>
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
                    <div className="grid gap-3 lg:grid-cols-[1fr_210px_120px_auto] lg:items-end">
                      <AdminFormField label="Option Label">
                        <input className={adminInputClass} value={option.label} onChange={(e) => updateOption(optionIndex, { label: e.target.value })} placeholder="Current Rank" />
                      </AdminFormField>
                        <AdminFormField label="Type">
                        <select
                          className={adminSelectClass}
                          value={optionTypes.some(([value]) => value === option.type) ? option.type : "dropdown"}
                          onChange={(e) => updateOption(optionIndex, { type: e.target.value as ServiceOption["type"] })}
                        >
                          {optionTypes.map(([value, label]) => (
                            <option
                              key={value}
                              value={value}
                              disabled={value === "quantity" && hasQuantityOption && option.type !== "quantity"}
                            >
                              {label}
                            </option>
                          ))}
                        </select>
                      </AdminFormField>
                      <label className="flex h-11 items-center gap-2 text-sm text-white">
                        <input type="checkbox" checked={option.required} onChange={(e) => updateOption(optionIndex, { required: e.target.checked })} />
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
                    <p className="mt-3 rounded-md border border-[#172554] bg-[#050816] px-3 py-2 text-xs text-[#94A3B8]">
                      Preview: {optionPreview(option)}
                    </p>

                    {isChoiceType(option.type) ? (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-[#94A3B8]">Choices</p>
                          <button
                            type="button"
                            onClick={() =>
                              setOptionsSchema((current) =>
                                current.map((item, index) =>
                                  index === optionIndex ? { ...item, options: [...(item.options ?? []), emptyChoice()] } : item,
                                ),
                              )
                            }
                            className="text-sm text-[#22D3EE]"
                          >
                            + Add choice
                          </button>
                        </div>
                        {(option.options ?? []).map((choice, choiceIndex) => (
                          <div key={choiceIndex} className="grid gap-3 md:grid-cols-[1fr_140px_140px_auto] md:items-center">
                            <input className={adminInputClass} value={choice.label} onChange={(e) => updateChoice(optionIndex, choiceIndex, { label: e.target.value })} placeholder="Choice label" />
                            <input type="number" min="0" step="0.01" className={adminInputClass} value={choice.priceUSD} onChange={(e) => updateChoice(optionIndex, choiceIndex, { priceUSD: Number(e.target.value) })} placeholder="USD" />
                            <input type="number" min="0" step="0.01" className={adminInputClass} value={choice.priceEUR} onChange={(e) => updateChoice(optionIndex, choiceIndex, { priceEUR: Number(e.target.value) })} placeholder="EUR" />
                            <button
                              type="button"
                              onClick={() =>
                                setOptionsSchema((current) =>
                                  current.map((item, index) =>
                                    index === optionIndex
                                      ? { ...item, options: (item.options ?? []).filter((_, currentChoiceIndex) => currentChoiceIndex !== choiceIndex) }
                                      : item,
                                  ),
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
                    ) : null}

                    {isUnitType(option.type) ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-4">
                        <AdminFormField label="Minimum">
                          <input type="number" min="0" className={adminInputClass} value={option.min ?? 1} onChange={(e) => updateOption(optionIndex, { min: Number(e.target.value) })} />
                        </AdminFormField>
                        <AdminFormField label="Maximum">
                          <input type="number" min="0" className={adminInputClass} value={option.max ?? 10} onChange={(e) => updateOption(optionIndex, { max: Number(e.target.value) })} />
                        </AdminFormField>
                        <AdminFormField label={option.type === "range" ? "USD / Value" : "USD / Count"}>
                          <input type="number" min="0" step="0.01" className={adminInputClass} value={option.pricePerUnitUSD ?? 0} onChange={(e) => updateOption(optionIndex, { pricePerUnitUSD: Number(e.target.value) })} />
                        </AdminFormField>
                        <AdminFormField label={option.type === "range" ? "EUR / Value" : "EUR / Count"}>
                          <input type="number" min="0" step="0.01" className={adminInputClass} value={option.pricePerUnitEUR ?? 0} onChange={(e) => updateOption(optionIndex, { pricePerUnitEUR: Number(e.target.value) })} />
                        </AdminFormField>
                        {option.type === "number_stepper" ? (
                          <p className="text-xs leading-5 text-[#94A3B8] md:col-span-4">
                            Number stepper shows minus and plus controls on the service page. Each count adds the configured price to the total.
                          </p>
                        ) : (
                          <p className="text-xs leading-5 text-[#94A3B8] md:col-span-4">
                            Range slider shows a draggable slider. The selected value affects price.
                          </p>
                        )}
                      </div>
                    ) : null}

                    {isQuantityType(option.type) ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <AdminFormField label="Minimum Quantity">
                          <input type="number" min="1" className={adminInputClass} value={option.min ?? 1} onChange={(e) => updateOption(optionIndex, { min: Number(e.target.value) })} />
                        </AdminFormField>
                        <AdminFormField label="Maximum Quantity">
                          <input type="number" min="1" className={adminInputClass} value={option.max ?? 99} onChange={(e) => updateOption(optionIndex, { max: Number(e.target.value) })} />
                        </AdminFormField>
                        <p className="text-xs leading-5 text-[#94A3B8] md:col-span-2">
                          Quantity multiplies the configured service total. Add this only for services that can be bought more than once.
                        </p>
                      </div>
                    ) : null}

                    {option.type === "toggle" ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <AdminFormField label="Disabled Text">
                          <input className={adminInputClass} value={option.disabledLabel ?? "No"} onChange={(e) => updateOption(optionIndex, { disabledLabel: e.target.value })} placeholder="No" />
                        </AdminFormField>
                        <AdminFormField label="Enabled Text">
                          <input className={adminInputClass} value={option.enabledLabel ?? "Yes"} onChange={(e) => updateOption(optionIndex, { enabledLabel: e.target.value })} placeholder="Yes" />
                        </AdminFormField>
                        <AdminFormField label="USD if enabled">
                          <input type="number" min="0" step="0.01" className={adminInputClass} value={option.priceUSD ?? 0} onChange={(e) => updateOption(optionIndex, { priceUSD: Number(e.target.value) })} />
                        </AdminFormField>
                        <AdminFormField label="EUR if enabled">
                          <input type="number" min="0" step="0.01" className={adminInputClass} value={option.priceEUR ?? 0} onChange={(e) => updateOption(optionIndex, { priceEUR: Number(e.target.value) })} />
                        </AdminFormField>
                      </div>
                    ) : null}

                    {(option.type === "text" || option.type === "textarea") ? (
                      <AdminFormField className="mt-4" label="Placeholder">
                        <input className={adminInputClass} value={option.placeholder ?? ""} onChange={(e) => updateOption(optionIndex, { placeholder: e.target.value })} placeholder="Customer-facing placeholder text" />
                      </AdminFormField>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section id="service-form-benefits" className={sectionClass}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">What You Get</h2>
              {benefits.length < 4 && (
                <button type="button" onClick={() => setBenefits((current) => [...current, emptyBenefit()])} className="flex items-center gap-1 text-sm text-[#22D3EE]">
                  <Plus size={14} /> Add benefit
                </button>
              )}
            </div>
            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="grid gap-2 rounded-lg border border-[var(--ms-accent)] bg-[var(--ms-primary)] p-3">
                  <input className={adminInputClass} value={benefit.icon} onChange={(e) => setBenefits((current) => current.map((item, i) => i === index ? { ...item, icon: e.target.value } : item))} placeholder="tabler-shield" />
                  <input className={adminInputClass} value={benefit.title} onChange={(e) => setBenefits((current) => current.map((item, i) => i === index ? { ...item, title: e.target.value } : item))} placeholder="Title" />
                  <textarea className={adminTextareaClass} value={benefit.description} onChange={(e) => setBenefits((current) => current.map((item, i) => i === index ? { ...item, description: e.target.value } : item))} placeholder="Description" />
                </div>
              ))}
            </div>
          </section>

          <section id="service-form-requirements" className={sectionClass}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Requirements</h2>
              <button type="button" onClick={() => setRequirements((current) => [...current, ""])} className="text-sm text-[#22D3EE]">
                + Add row
              </button>
            </div>
            {requirements.map((req, index) => (
              <div key={index} className="mb-2 flex gap-2">
                <input className={adminInputClass} value={req} onChange={(e) => setRequirements((current) => current.map((item, i) => i === index ? e.target.value : item))} />
                <button type="button" onClick={() => setRequirements((current) => current.filter((_, i) => i !== index))} className="p-2 text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </section>

          <section id="service-form-details" className={sectionClass}>
            <h2 className="mb-4 text-lg font-bold text-white">Service Details</h2>
            <textarea className={adminTextareaClass + " min-h-[160px]"} value={description} onChange={(e) => setDescription(e.target.value)} />
          </section>
        </div>
      </div>
    </form>
  );
}
