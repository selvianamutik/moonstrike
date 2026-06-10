import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/admin/audit";
import { hashAdminPassword, verifyAdminPassword } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminPasswordRow = {
  password_hash: string;
};

export async function PATCH(request: NextRequest) {
  const admin = await getAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Current password and new password are required." }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }

  if (currentPassword === newPassword) {
    return NextResponse.json({ error: "New password should be different from the current password." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("password_hash")
    .eq("id", admin.id)
    .maybeSingle<AdminPasswordRow>();

  if (error || !data) {
    return NextResponse.json({ error: "Admin account was not found." }, { status: 404 });
  }

  if (!verifyAdminPassword(currentPassword, data.password_hash)) {
    await writeAuditLog({
      action: "Admin password change blocked by invalid current password",
      status: "blocked",
      request,
      admin,
    });

    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("admin_users")
    .update({ password_hash: hashAdminPassword(newPassword) })
    .eq("id", admin.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update password." }, { status: 500 });
  }

  await writeAuditLog({
    action: "Admin password changed",
    status: "success",
    request,
    admin,
  });

  return NextResponse.json({ ok: true });
}
