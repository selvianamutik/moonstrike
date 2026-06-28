import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/lib/admin/audit";
import { cleanupOldData } from "@/lib/data-cleanup";

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
      action: "Data cleanup cron blocked: unauthorized request",
      status: "blocked",
      request,
      eventType: "cron",
      actorLabel: "System (Cron)",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const rawMediaMode = params.get("media");
  const mediaMode = rawMediaMode === "delete" || rawMediaMode === "dry-run" ? rawMediaMode : "skip";

  try {
    const result = await cleanupOldData({
      anonymousCartMaxAgeSeconds: positiveNumber(params.get("anonymousCartMaxAgeSeconds"), 60 * 60),
      emptyCartRetentionHours: positiveNumber(params.get("emptyCartRetentionHours"), 24),
      checkoutSessionRetentionHours: positiveNumber(params.get("checkoutSessionRetentionHours"), 24),
      notificationRetentionDays: positiveNumber(params.get("notificationRetentionDays"), 30),
      mediaMode,
      mediaMinAgeHours: positiveNumber(params.get("mediaMinAgeHours"), 24),
      maxMediaCandidates: positiveNumber(params.get("maxMediaCandidates"), 50),
    });

    await writeAuditLog({
      action: `Data cleanup cron completed: ${result.deletedCount} row(s) deleted`,
      status: "success",
      request,
      eventType: "cron",
      actorLabel: "System (Cron)",
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Data cleanup failed.";
    await writeAuditLog({
      action: `Data cleanup cron failed: ${message}`,
      status: "critical",
      request,
      eventType: "cron",
      actorLabel: "System (Cron)",
    });
    throw error;
  }
}
