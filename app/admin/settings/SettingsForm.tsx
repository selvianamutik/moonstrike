"use client";

import { useMemo, useState } from "react";
import { Bell, KeyRound, Save, Settings2, User } from "lucide-react";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminFormField, adminInputClass, adminSelectClass } from "@/components/admin/AdminFormField";
import type { AdminSettings } from "@/lib/admin/settings";
import { cleanupUploadedMedia } from "@/lib/cms/client-media-cleanup";

type SettingsFormProps = {
  initialSettings: AdminSettings;
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

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [pendingAvatarPath, setPendingAvatarPath] = useState("");

  const initials = useMemo(() => {
    const parts = settings.adminDisplayName.trim().split(/\s+/).filter(Boolean);
    return (parts[0]?.[0] ?? "A") + (parts[1]?.[0] ?? "A");
  }, [settings.adminDisplayName]);

  function updateSetting<K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function resetMessages() {
    setStatusMessage("");
    setErrorMessage("");
  }

  async function saveSettings() {
    resetMessages();
    setIsSaving(true);

    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const payload = await response.json().catch(() => null);
    setIsSaving(false);

    if (!response.ok) {
      setErrorMessage(payload?.error ?? "Failed to save settings.");
      return;
    }

    setPendingAvatarPath("");
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

  async function uploadAvatar(file: File) {
    resetMessages();
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

      if (pendingAvatarPath) {
        void cleanupUploadedMedia([pendingAvatarPath]);
      }

      updateSetting("adminAvatar", payload.imageUrl);
      setPendingAvatarPath(typeof payload.storagePath === "string" ? payload.storagePath : "");
      setStatusMessage("Avatar uploaded. Save settings to apply it.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to upload avatar.");
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
          <Section icon={<User size={16} className="text-[#8B5CF6]" />} title="Profile Settings">
            <div className="mb-6 flex items-start gap-6">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#22D3EE]/30 bg-[var(--ms-accent)] text-2xl font-bold uppercase text-white">
                {settings.adminAvatar ? (
                  <img src={settings.adminAvatar} alt="" className="h-full w-full object-cover" />
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
                      if (file) void uploadAvatar(file);
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
            if (pendingAvatarPath) void cleanupUploadedMedia([pendingAvatarPath]);
            setPendingAvatarPath("");
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
