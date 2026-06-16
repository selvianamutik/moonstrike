import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/lib/admin/audit";
import { cleanupExpiredChatTickets } from "@/lib/chat";

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
      action: "Chat cleanup cron blocked: unauthorized request",
      status: "blocked",
      request,
      eventType: "cron",
      actorLabel: "System (Cron)",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;

  try {
    const result = await cleanupExpiredChatTickets({
      anonymousMaxAgeSeconds: positiveNumber(params.get("anonymousMaxAgeSeconds"), 60 * 60),
      loggedInSupportRetentionDays: positiveNumber(params.get("supportDays"), 90),
      orderChatRetentionDays: positiveNumber(params.get("orderDays"), 30),
    });

    await writeAuditLog({
      action: `Chat cleanup cron completed: ${result.deletedCount} ticket(s)`,
      status: "success",
      request,
      eventType: "cron",
      actorLabel: "System (Cron)",
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat cleanup failed.";
    await writeAuditLog({
      action: `Chat cleanup cron failed: ${message}`,
      status: "critical",
      request,
      eventType: "cron",
      actorLabel: "System (Cron)",
    });
    throw error;
  }
}
