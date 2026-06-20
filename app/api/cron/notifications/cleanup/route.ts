import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/lib/admin/audit";
import { cleanupReadNotifications } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const vercelCronHeader = request.headers.get("x-vercel-cron");

  if (vercelCronHeader === "1") return true;
  if (!cronSecret) return false;

  return authHeader === `Bearer ${cronSecret}`;
}

function positiveNumber(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    await writeAuditLog({
      action: "Notification cleanup cron blocked: unauthorized request",
      status: "blocked",
      request,
      eventType: "cron",
      actorLabel: "System (Cron)",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const retentionDays = positiveNumber(request.nextUrl.searchParams.get("retentionDays"), 30);

  try {
    const result = await cleanupReadNotifications(retentionDays);

    await writeAuditLog({
      action: `Notification cleanup cron completed: ${result.deletedCount} notification(s)`,
      status: "success",
      request,
      eventType: "cron",
      actorLabel: "System (Cron)",
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Notification cleanup failed.";
    await writeAuditLog({
      action: `Notification cleanup cron failed: ${message}`,
      status: "critical",
      request,
      eventType: "cron",
      actorLabel: "System (Cron)",
    });
    throw error;
  }
}
