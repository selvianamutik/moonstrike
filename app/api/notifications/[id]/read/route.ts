import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { markNotificationRead } from "@/lib/notifications";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;

  try {
    await markNotificationRead("customer", user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update notification." }, { status: 500 });
  }
}
