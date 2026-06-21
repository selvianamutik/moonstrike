import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/lib/admin/audit";
import { cleanupExpiredAnonymousChatTickets } from "@/lib/chat";

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

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    await writeAuditLog({
      action: "Anonymous chat cleanup cron blocked: unauthorized request",
      status: "blocked",
      request,
      eventType: "cron",
      actorLabel: "System (Cron)",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let result: Awaited<ReturnType<typeof cleanupExpiredAnonymousChatTickets>>;

  try {
    result = await cleanupExpiredAnonymousChatTickets();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Anonymous chat cleanup failed.";
    await writeAuditLog({
      action: `Anonymous chat cleanup cron failed: ${message}`,
      status: "critical",
      request,
      eventType: "cron",
      actorLabel: "System (Cron)",
    });
    throw error;
  }

  await writeAuditLog({
    action: `Anonymous chat cleanup cron completed: ${result.deletedCount} ticket(s)`,
    status: "success",
    request,
    eventType: "cron",
    actorLabel: "System (Cron)",
  });

  return NextResponse.json({
    ok: true,
    deletedCount: result.deletedCount,
    expiresBefore: result.expiresBefore,
  });
}
