import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { getUnreadNotificationCount } from "@/lib/notifications";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const unreadCount = await getUnreadNotificationCount("admin", admin.id);
    return NextResponse.json({ unreadCount });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load notifications." }, { status: 500 });
  }
}
