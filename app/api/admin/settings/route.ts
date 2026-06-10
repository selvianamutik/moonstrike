import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/admin/audit";
import { CMS_MEDIA_BUCKET, getStoragePathFromPublicUrl } from "@/lib/cms/storage";
import { createAdminClient } from "@/lib/supabase/admin";

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const adminDisplayName = stringValue(body?.adminDisplayName);
  const adminEmail = stringValue(body?.adminEmail).toLowerCase();
  const adminAvatar = stringValue(body?.adminAvatar);
  const sessionTimeoutHours = numberValue(body?.sessionTimeoutHours, 8);
  const refundWindowDays = numberValue(body?.refundWindowDays, 7);
  const autoCompleteDays = numberValue(body?.autoCompleteDays, 7);

  if (!adminDisplayName || !adminEmail) {
    return NextResponse.json({ error: "Admin display name and email are required." }, { status: 400 });
  }

  if (sessionTimeoutHours < 1 || sessionTimeoutHours > 168) {
    return NextResponse.json({ error: "Session timeout must be between 1 and 168 hours." }, { status: 400 });
  }

  if (refundWindowDays < 0 || refundWindowDays > 30 || autoCompleteDays < 0 || autoCompleteDays > 30) {
    return NextResponse.json({ error: "Refund and auto-complete windows must be between 0 and 30 days." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: currentSettings } = await supabase
    .from("system_settings")
    .select("admin_avatar")
    .eq("id", "singleton")
    .maybeSingle();
  const previousAvatar = currentSettings?.admin_avatar || "";

  const { error: adminError } = await supabase
    .from("admin_users")
    .update({
      display_name: adminDisplayName,
      email: adminEmail,
      avatar: adminAvatar,
    })
    .eq("id", admin.id);

  if (adminError) {
    const message = adminError.code === "23505" ? "That admin email is already used." : "Failed to update admin profile.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { error: settingsError } = await supabase.from("system_settings").upsert(
    {
      id: "singleton",
      admin_display_name: adminDisplayName,
      admin_email: adminEmail,
      admin_avatar: adminAvatar,
      session_timeout_hours: sessionTimeoutHours,
      refund_window_days: refundWindowDays,
      auto_complete_days: autoCompleteDays,
      notify_order_created: booleanValue(body?.notifyOrderCreated, true),
      notify_refund_requested: booleanValue(body?.notifyRefundRequested, true),
      notify_order_completed: booleanValue(body?.notifyOrderCompleted, true),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (settingsError) {
    return NextResponse.json({ error: "Failed to save settings." }, { status: 500 });
  }

  await writeAuditLog({
    action: "Admin settings updated",
    status: "success",
    request,
    admin,
  });

  if (previousAvatar && previousAvatar !== adminAvatar) {
    const previousPath = getStoragePathFromPublicUrl(previousAvatar);

    if (previousPath?.startsWith("admins/")) {
      await supabase.storage.from(CMS_MEDIA_BUCKET).remove([previousPath]);
    }
  }

  return NextResponse.json({ ok: true });
}
