import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getAdminSession } from "@/lib/admin/session";
import { getAdminSettings } from "@/lib/admin/settings";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const admin = await getAdminSession();

  if (!admin) {
    redirect("/admin/login");
  }

  const settings = await getAdminSettings(admin.id);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={[{ label: "System" }, { label: "Settings", active: true }]}
        title="Terminal Configuration"
        description="Manage operational settings, admin identity, and notification events."
      />

      <SettingsForm initialSettings={settings} />
    </div>
  );
}
