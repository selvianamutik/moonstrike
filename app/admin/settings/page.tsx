import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getAdminSession } from "@/lib/admin/session";
import { getAdminSettings } from "@/lib/admin/settings";
import { SettingsForm } from "./SettingsForm";
import type { PaymentSettingRow } from "@/lib/admin/payment-settings";

export default async function SettingsPage() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin/login");
  }

  const settings = await getAdminSettings(admin.id);
  const { getPaymentSettings } = await import("@/lib/admin/payment-settings");
  let paymentSettings: PaymentSettingRow[] = [];
  try {
    paymentSettings = await getPaymentSettings();
  } catch (e) {
    console.error("Failed to load payment settings", e);
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={[{ label: "System" }, { label: "Settings", active: true }]}
        title="Terminal Configuration"
        description="Manage operational settings, admin identity, and notification events."
      />

      <SettingsForm initialSettings={settings} initialPaymentSettings={paymentSettings} />
    </div>
  );
}
