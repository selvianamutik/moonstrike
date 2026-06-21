import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { markAllNotificationsRead } from "@/lib/notifications";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    await markAllNotificationsRead("customer", user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update notifications." }, { status: 500 });
  }
}
