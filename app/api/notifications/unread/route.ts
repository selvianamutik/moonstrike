import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUnreadNotificationCount } from "@/lib/notifications";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ unreadCount: 0 });

  try {
    const unreadCount = await getUnreadNotificationCount("customer", user.id);
    return NextResponse.json({ unreadCount });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load notifications." }, { status: 500 });
  }
}
