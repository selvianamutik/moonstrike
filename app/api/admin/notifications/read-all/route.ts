import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { markAllNotificationsRead } from "@/lib/notifications";

export async function POST() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    await markAllNotificationsRead("admin", admin.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update notifications." }, { status: 500 });
  }
}
