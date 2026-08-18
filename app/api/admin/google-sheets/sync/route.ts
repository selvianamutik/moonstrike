import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import {
  enqueueGoogleSheetsSync,
  processPendingGoogleSheetsSyncJobs,
  type GoogleSheetsSyncTarget,
} from "@/lib/admin/google-sheets-sync";
import { writeAuditLog } from "@/lib/admin/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (admin.role !== "super_admin") {
    return NextResponse.json(
      { error: "Insufficient permissions. Only super admins can sync sheets." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const target = body?.target as GoogleSheetsSyncTarget;
  if (!["orders", "transactions", "all"].includes(target)) {
    return NextResponse.json(
      { error: "Invalid target. Must be orders, transactions, or all." },
      { status: 400 },
    );
  }

  try {
    await enqueueGoogleSheetsSync(target);
    const result = await processPendingGoogleSheetsSyncJobs();

    await writeAuditLog({
      action: `Manual Google Sheets sync triggered: ${target}`,
      status: result.failedCount > 0 ? "blocked" : "success",
      request,
      admin,
      eventType: "admin_action",
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google Sheets sync failed.";

    await writeAuditLog({
      action: `Manual Google Sheets sync failed: ${target} - ${message}`,
      status: "critical",
      request,
      admin,
      eventType: "admin_action",
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}