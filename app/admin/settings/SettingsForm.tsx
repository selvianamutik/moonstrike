"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, KeyRound, Save, Settings2, User, Share2 } from "lucide-react";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminFormField, adminInputClass, adminSelectClass } from "@/components/admin/AdminFormField";
import type { AdminSettings } from "@/lib/admin/settings";
import { cleanupUploadedMedia } from "@/lib/cms/client-media-cleanup";

import type { PaymentSettingRow } from "@/lib/admin/payment-settings";
import { CreditCard } from "lucide-react";

type SocialMediaSetting = {
  platform: string
  url: string | null
  is_active: boolean
}

type SettingsFormProps = {
  initialSettings: AdminSettings;
  initialPaymentSettings?: PaymentSettingRow[];
};

function Section({
  children,
  icon,
  title,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-xl border border-[var(--ms-accent)] bg-[var(--ms-secondary)] p-6">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8B5CF6]/20">{icon}</div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image."));
    };
    image.src = url;
  });
}

async function resizeToWebp(file: File, maxWidth: number, quality: number) {
  const image = await loadImage(file);
  const scale = Math.min(1, maxWidth / image.width);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare image.");
  }

  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", quality);
  });

  if (!blob) {
    throw new Error("Could not compress image.");
  }

  return new File([blob], "admin-avatar.webp", { type: "image/webp" });
}

export function SettingsForm({ initialSettings, initialPaymentSettings = [] }: SettingsFormProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [paymentSettings, setPaymentSettings] = useState(initialPaymentSettings);
  const [socialMedia, setSocialMedia] = useState<SocialMediaSetting[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [draftAvatarFile, setDraftAvatarFile] = useState<File | null>(null);
  const [draftAvatarPreview, setDraftAvatarPreview] = useState("");

  // Load social media settings
  useEffect(() => {
    fetch('/api/admin/settings/social-media')
      .then((r) => r.json())
      .then((data) => setSocialMedia(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (draftAvatarPreview) URL.revokeObjectURL(draftAvatarPreview);
    };
  }, [draftAvatarPreview]);

  const initials = useMemo(() => {
    const parts = settings.adminDisplayName.trim().split(/\s+/).filter(Boolean);
    return (parts[0]?.[0] ?? "A") + (parts[1]?.[0] ?? "A");
  }, [settings.adminDisplayName]);

  function updateSetting<K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function updatePayment(method: string, key: keyof PaymentSettingRow, value: any) {
    setPaymentSettings((prev) => prev.map((p) => (p.method === method ? { ...p, [key]: value } : p)));
  }

  function resetMessages() {
    setStatusMessage("");
    setErrorMessage("");
  }

  async function saveSettings() {
    resetMessages();
    setIsSaving(true);
    let uploadedAvatarPath = "";

    let nextSettings = settings;

    if (draftAvatarFile) {
      try {
        const uploadedAvatar = await uploadAvatar(draftAvatarFile);
        nextSettings = { ...settings, adminAvatar: uploadedAvatar.imageUrl };
        uploadedAvatarPath = uploadedAvatar.storagePath;
      } catch (error) {
        setIsSaving(false);
        setErrorMessage(error instanceof Error ? error.message : "Failed to upload avatar.");
        return;
      }
    }

    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextSettings),
    });
    const payload = await response.json().catch(() => null);

    // Save payment settings sequentially
    for (const p of paymentSettings) {
      await fetch("/api/admin/payment-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: p.method, tax_rate: p.tax_rate, tax_label: p.tax_label, enabled: p.enabled }),
      });
    }

    setIsSaving(false);

    if (!response.ok) {
      if (uploadedAvatarPath) void cleanupUploadedMedia([uploadedAvatarPath]);
      setErrorMessage(payload?.error ?? "Failed to save settings.");
      return;
    }

    setSettings(nextSettings);
    if (draftAvatarPreview) URL.revokeObjectURL(draftAvatarPreview);
    setDraftAvatarFile(null);
    setDraftAvatarPreview("");
    setStatusMessage("Settings saved.");
  }

  async function changePassword() {
    resetMessages();

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirmation do not match.");
      return;
    }

    setIsChangingPassword(true);
    const response = await fetch("/api/admin/settings/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const payload = await response.json().catch(() => null);
    setIsChangingPassword(false);

    if (!response.ok) {
      setErrorMessage(payload?.error ?? "Failed to change password.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setStatusMessage("Password changed.");
  }

  function selectAvatar(file: File) {
    resetMessages();
    if (draftAvatarPreview) URL.revokeObjectURL(draftAvatarPreview);
    setDraftAvatarFile(file);
    setDraftAvatarPreview(URL.createObjectURL(file));
    setStatusMessage("Avatar selected. Save settings to apply it.");
  }

  async function uploadAvatar(file: File) {
    setIsUploadingAvatar(true);

    try {
      const compressed = await resizeToWebp(file, 512, 0.82);
      const formData = new FormData();
      formData.append("image", compressed);

      const response = await fetch("/api/admin/settings/avatar", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.imageUrl) {
        throw new Error(payload?.error ?? "Failed to upload avatar.");
      }

      return {
        imageUrl: String(payload.imageUrl),
        storagePath: typeof payload.storagePath === "string" ? payload.storagePath : "",
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to upload avatar.");
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function updateSocialMedia(platform: string, url: string | null, is_active: boolean) {
    resetMessages();
    try {
      const response = await fetch('/api/admin/settings/social-media', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, url, is_active }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? 'Failed to update social media.');
      }

      const updated = await response.json();
      setSocialMedia((prev) => prev.map((s) => (s.platform === platform ? updated : s)));
      setStatusMessage(`${platform} updated.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update social media.');
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
          <Section icon={<User size={16} className="text-[#8B5CF6]" />} title="Profile Settings">
            <div className="mb-6 flex items-start gap-6">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#22D3EE]/30 bg-[var(--ms-accent)] text-2xl font-bold uppercase text-white">
                {draftAvatarPreview || settings.adminAvatar ? (
                  <img src={draftAvatarPreview || settings.adminAvatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="flex-1">
                <AdminFormField label="Avatar image">
                  <input
                    className={adminInputClass}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) selectAvatar(file);
                      event.target.value = "";
                    }}
                    disabled={isUploadingAvatar}
                  />
                </AdminFormField>
                <p className="mt-2 text-xs text-[#64748B]">
                  Recommended 512 x 512 px. Uploads are compressed before storage, and the previous saved avatar is removed after saving.
                </p>
                {isUploadingAvatar ? <p className="mt-2 text-xs text-[#22D3EE]">Uploading avatar...</p> : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <AdminFormField label="Admin Display Name">
                <input className={adminInputClass} value={settings.adminDisplayName} onChange={(event) => updateSetting("adminDisplayName", event.target.value)} required />
              </AdminFormField>
              <AdminFormField label="Email Address">
                <input className={adminInputClass} value={settings.adminEmail} onChange={(event) => updateSetting("adminEmail", event.target.value)} type="email" required />
              </AdminFormField>
            </div>
          </Section>

          <Section icon={<KeyRound size={16} className="text-[#22D3EE]" />} title="Security Password">
            <div className="grid gap-4 md:grid-cols-3">
              <AdminFormField label="Current Password">
                <input className={adminInputClass} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} type="password" autoComplete="current-password" />
              </AdminFormField>
              <AdminFormField label="New Password">
                <input className={adminInputClass} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" autoComplete="new-password" />
              </AdminFormField>
              <AdminFormField label="Confirm Password">
                <input className={adminInputClass} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" autoComplete="new-password" />
              </AdminFormField>
            </div>
            <AdminButton className="mt-4" variant="secondary" onClick={changePassword} disabled={isChangingPassword}>
              <KeyRound size={16} />
              {isChangingPassword ? "Changing..." : "Change Password"}
            </AdminButton>
          </Section>

          <Section icon={<Settings2 size={16} className="text-[#22D3EE]" />} title="Application Settings">
            <div className="grid gap-4 md:grid-cols-2">
              <AdminFormField label="Session timeout duration">
                <select className={adminSelectClass} value={settings.sessionTimeoutHours} onChange={(event) => updateSetting("sessionTimeoutHours", Number(event.target.value))}>
                  <option value={4}>4 hours</option>
                  <option value={8}>8 hours</option>
                  <option value={12}>12 hours</option>
                  <option value={24}>24 hours</option>
                </select>
                <p className="mt-2 text-xs text-[var(--ms-text-secondary)]">Applies to new admin logins. Remember-terminal still uses 30 days.</p>
              </AdminFormField>
              <AdminFormField label="Refund window after completion">
                <select className={adminSelectClass} value={settings.refundWindowDays} onChange={(event) => updateSetting("refundWindowDays", Number(event.target.value))}>
                  <option value={3}>3 days</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </AdminFormField>
              <AdminFormField label="Auto-complete delivered orders">
                <select className={adminSelectClass} value={settings.autoCompleteDays} onChange={(event) => updateSetting("autoCompleteDays", Number(event.target.value))}>
                  <option value={0}>Disabled</option>
                  <option value={3}>After 3 days</option>
                  <option value={7}>After 7 days</option>
                  <option value={14}>After 14 days</option>
                </select>
              </AdminFormField>
            </div>
          </Section>

          <Section icon={<CreditCard size={16} className="text-[#22D3EE]" />} title="Payment Methods & Taxes">
            <div className="grid gap-4 md:grid-cols-2">
              {paymentSettings.map((payment) => (
                <div key={payment.method} className="flex flex-col gap-2 rounded-lg border border-[var(--ms-accent)] bg-[#050816] p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase">{payment.method}</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs text-[var(--ms-text-secondary)]">{payment.enabled ? "Enabled" : "Disabled"}</span>
                      <input 
                        type="checkbox" 
                        checked={payment.enabled} 
                        onChange={(e) => updatePayment(payment.method, "enabled", e.target.checked)} 
                        className="h-4 w-4 rounded border-[#172554] bg-[#0F172A] accent-[#8B5CF6]"
                      />
                    </label>
                  </div>
                  <AdminFormField label="Tax Rate (%)">
                    <input 
                      className={adminInputClass} 
                      type="number" 
                      step="0.01" 
                      value={payment.tax_rate * 100} 
                      onChange={(e) => updatePayment(payment.method, "tax_rate", Number(e.target.value) / 100)} 
                    />
                  </AdminFormField>
                  <AdminFormField label="Tax Label">
                    <input 
                      className={adminInputClass} 
                      type="text" 
                      value={payment.tax_label} 
                      onChange={(e) => updatePayment(payment.method, "tax_label", e.target.value)} 
                      placeholder="e.g. VAT, Service Tax"
                    />
                  </AdminFormField>
                </div>
              ))}
              {paymentSettings.length === 0 && (
                <p className="text-sm text-[var(--ms-text-secondary)]">No payment methods configured in database.</p>
              )}
            </div>
          </Section>

          <Section icon={<Share2 size={16} className="text-blue-300" />} title="Social Media Links">
            <div className="grid gap-4">
              {socialMedia.map((social) => (
                <div key={social.platform} className="rounded-lg border border-[#172554] bg-[#050816] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold capitalize text-white">{social.platform}</span>
                    <label className="flex items-center gap-2">
                      <span className="text-xs text-[var(--ms-text-secondary)]">Active</span>
                      <input
                        type="checkbox"
                        checked={social.is_active}
                        onChange={(e) => updateSocialMedia(social.platform, social.url, e.target.checked)}
                        className="h-4 w-4 rounded border-[#172554] bg-[#0F172A] accent-[#8B5CF6]"
                      />
                    </label>
                  </div>
                  <input
                    type={social.platform === "email" ? "email" : social.platform === "phone" ? "tel" : "url"}
                    className={adminInputClass}
                    value={social.url || ''}
                    onChange={(e) => {
                      setSocialMedia((prev) =>
                        prev.map((s) => (s.platform === social.platform ? { ...s, url: e.target.value } : s))
                      );
                    }}
                    onBlur={(e) => updateSocialMedia(social.platform, e.target.value || null, social.is_active)}
                    placeholder={
                      social.platform === "email"
                        ? "Enter support email address"
                        : social.platform === "phone"
                        ? "Enter phone number e.g. +1 (555) 123-4567"
                        : `Enter ${social.platform} URL`
                    }
                  />
                </div>
              ))}
              {socialMedia.length === 0 && (
                <p className="text-sm text-[var(--ms-text-secondary)]">Loading social media settings...</p>
              )}
            </div>
          </Section>

          <Section icon={<Bell size={16} className="text-amber-300" />} title="Notification Events">
            <div className="grid gap-3">
              {[
                ["notifyOrderCreated", "New order enters pending"],
                ["notifyRefundRequested", "Customer requests refund"],
                ["notifyOrderCompleted", "Order is marked completed"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center justify-between rounded-lg border border-[#172554] bg-[#050816] px-4 py-3 text-sm text-white">
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(settings[key as keyof AdminSettings])}
                    onChange={(event) => updateSetting(key as keyof AdminSettings, event.target.checked as never)}
                    className="h-4 w-4 rounded border-[#172554] bg-[#0F172A] accent-[#8B5CF6]"
                  />
                </label>
              ))}
            </div>
          </Section>
      </div>

      <div className="sticky bottom-4 z-10 mt-6 flex items-center gap-3 rounded-xl border border-[#172554] bg-[#050816]/95 p-4 backdrop-blur">
        <AdminButton onClick={saveSettings} disabled={isSaving || isUploadingAvatar}>
          <Save size={16} />
          {isSaving ? "Saving..." : "Save All Changes"}
        </AdminButton>
        <AdminButton
          variant="secondary"
          onClick={() => {
            if (draftAvatarPreview) URL.revokeObjectURL(draftAvatarPreview);
            setDraftAvatarFile(null);
            setDraftAvatarPreview("");
            setSettings(initialSettings);
          }}
        >
          Discard
        </AdminButton>
        {statusMessage ? <span className="text-sm text-green-400">{statusMessage}</span> : null}
        {errorMessage ? <span className="text-sm text-red-400">{errorMessage}</span> : null}
      </div>
    </>
  );
}
