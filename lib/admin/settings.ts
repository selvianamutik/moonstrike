import { createAdminClient } from "@/lib/supabase/admin";

export type AdminSettings = {
  adminDisplayName: string;
  adminEmail: string;
  adminAvatar: string;
  sessionTimeoutHours: number;
  refundWindowDays: number;
  autoCompleteDays: number;
  notifyOrderCreated: boolean;
  notifyRefundRequested: boolean;
  notifyOrderCompleted: boolean;
  updatedAt: string | null;
};

type SystemSettingsRow = {
  admin_display_name: string | null;
  admin_email: string | null;
  admin_avatar: string | null;
  session_timeout_hours: number | null;
  refund_window_days: number | null;
  auto_complete_days: number | null;
  notify_order_created: boolean | null;
  notify_refund_requested: boolean | null;
  notify_order_completed: boolean | null;
  updated_at: string | null;
};

type AdminUserRow = {
  display_name: string;
  email: string;
  avatar: string;
};

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  adminDisplayName: "Admin Alpha",
  adminEmail: "",
  adminAvatar: "",
  sessionTimeoutHours: 8,
  refundWindowDays: 7,
  autoCompleteDays: 7,
  notifyOrderCreated: true,
  notifyRefundRequested: true,
  notifyOrderCompleted: true,
  updatedAt: null,
};

function normalizeSettings(row: SystemSettingsRow | null, adminUser?: AdminUserRow | null): AdminSettings {
  return {
    adminDisplayName: row?.admin_display_name || adminUser?.display_name || DEFAULT_ADMIN_SETTINGS.adminDisplayName,
    adminEmail: row?.admin_email || adminUser?.email || DEFAULT_ADMIN_SETTINGS.adminEmail,
    adminAvatar: row?.admin_avatar || adminUser?.avatar || DEFAULT_ADMIN_SETTINGS.adminAvatar,
    sessionTimeoutHours: row?.session_timeout_hours ?? DEFAULT_ADMIN_SETTINGS.sessionTimeoutHours,
    refundWindowDays: row?.refund_window_days ?? DEFAULT_ADMIN_SETTINGS.refundWindowDays,
    autoCompleteDays: row?.auto_complete_days ?? DEFAULT_ADMIN_SETTINGS.autoCompleteDays,
    notifyOrderCreated: row?.notify_order_created ?? DEFAULT_ADMIN_SETTINGS.notifyOrderCreated,
    notifyRefundRequested: row?.notify_refund_requested ?? DEFAULT_ADMIN_SETTINGS.notifyRefundRequested,
    notifyOrderCompleted: row?.notify_order_completed ?? DEFAULT_ADMIN_SETTINGS.notifyOrderCompleted,
    updatedAt: row?.updated_at ?? null,
  };
}

export async function getAdminSettings(adminId?: string) {
  const supabase = createAdminClient();
  const [settingsResult, adminResult] = await Promise.all([
    supabase
      .from("system_settings")
      .select(
        "admin_display_name, admin_email, admin_avatar, session_timeout_hours, refund_window_days, auto_complete_days, notify_order_created, notify_refund_requested, notify_order_completed, updated_at",
      )
      .eq("id", "singleton")
      .maybeSingle<SystemSettingsRow>(),
    adminId
      ? supabase
          .from("admin_users")
          .select("display_name, email, avatar")
          .eq("id", adminId)
          .maybeSingle<AdminUserRow>()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (settingsResult.error) throw settingsResult.error;
  if (adminResult.error) throw adminResult.error;

  return normalizeSettings(settingsResult.data, adminResult.data);
}

export async function getAdminSessionTimeoutSeconds() {
  try {
    const settings = await getAdminSettings();
    return Math.max(1, settings.sessionTimeoutHours) * 60 * 60;
  } catch {
    return DEFAULT_ADMIN_SETTINGS.sessionTimeoutHours * 60 * 60;
  }
}
