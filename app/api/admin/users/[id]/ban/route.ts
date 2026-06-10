import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/admin/audit";
import { getAdminSession } from "@/lib/admin/session";
import { createAdminClient } from "@/lib/supabase/admin";

const longBanDuration = "876000h";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { banned?: boolean; reason?: string } | null;
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

  if (typeof body?.banned !== "boolean") {
    return NextResponse.json({ error: "Missing banned state" }, { status: 400 });
  }

  if (body.banned && reason.length < 3) {
    return NextResponse.json({ error: "Ban reason is required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.updateUserById(id, {
    ban_duration: body.banned ? longBanDuration : "none",
  });

  if (error) {
    await writeAuditLog({
      action: `${body.banned ? "Ban" : "Unban"} customer failed for ${id}: ${error.message}`,
      status: "critical",
      request,
      admin,
      eventType: "admin_action",
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { error: moderationError } = await supabase.from("user_moderation_events").insert({
    user_id: id,
    admin_id: admin.id,
    action: body.banned ? "banned" : "unbanned",
    reason,
  });

  if (moderationError) {
    await writeAuditLog({
      action: `${body.banned ? "Ban" : "Unban"} moderation event failed for ${data.user.email ?? id}: ${moderationError.message}`,
      status: "critical",
      request,
      admin,
      eventType: "admin_action",
    });
    return NextResponse.json({ error: moderationError.message }, { status: 500 });
  }

  await writeAuditLog({
    action: `${body.banned ? "Banned" : "Unbanned"} customer ${data.user.email ?? id}${reason ? `: ${reason}` : ""}`,
    status: "success",
    request,
    admin,
    eventType: "admin_action",
  });

  return NextResponse.json({ user: data.user });
}
