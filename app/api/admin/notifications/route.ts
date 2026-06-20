import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { listNotifications } from "@/lib/notifications";

function parseLimit(request: NextRequest) {
  const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? 30);
  if (!Number.isFinite(rawLimit)) return 30;
  return Math.min(Math.max(Math.floor(rawLimit), 1), 100);
}

export async function GET(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const notifications = await listNotifications("admin", admin.id, parseLimit(request));
    return NextResponse.json({ notifications });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load notifications." }, { status: 500 });
  }
}
