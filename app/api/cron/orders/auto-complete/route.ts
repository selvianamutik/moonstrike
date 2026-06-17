import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/lib/admin/audit";
import { autoCompleteDeliveredOrders } from "@/lib/orders";

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
      action: "Order auto-complete cron blocked: unauthorized request",
      status: "blocked",
      request,
      eventType: "cron",
      actorLabel: "System (Cron)",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let result;

  try {
    result = await autoCompleteDeliveredOrders();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Auto-complete failed.";
    await writeAuditLog({
      action: `Order auto-complete cron failed: ${message}`,
      status: "critical",
      request,
      eventType: "cron",
      actorLabel: "System (Cron)",
    });
    throw error;
  }

  await writeAuditLog({
    action: `Order auto-complete cron completed: ${result.completedCount} order(s)`,
    status: "success",
    request,
    eventType: "cron",
    actorLabel: "System (Cron)",
  });

  return NextResponse.json({
    ok: true,
    completedCount: result.completedCount,
    orderReferences: result.orderReferences,
    autoCompleteDays: result.autoCompleteDays,
  });
}
