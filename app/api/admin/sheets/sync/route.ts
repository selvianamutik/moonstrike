import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { clearGoogleSheetsSyncJob, syncGoogleSheets, type GoogleSheetsSyncTarget } from "@/lib/admin/google-sheets-sync";
import { writeAuditLog } from "@/lib/admin/audit";

const validTargets = new Set<GoogleSheetsSyncTarget>(["orders", "transactions", "all"]);

function parseTarget(value: unknown): GoogleSheetsSyncTarget {
  return typeof value === "string" && validTargets.has(value as GoogleSheetsSyncTarget)
    ? (value as GoogleSheetsSyncTarget)
    : "all";
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const target = parseTarget(body?.target);

  try {
    const result = await syncGoogleSheets(target);
    await clearGoogleSheetsSyncJob(target);
    await writeAuditLog({
      admin,
      request,
      eventType: "admin_action",
      action: `Synced Google Sheets (${target})`,
      status: "success",
    });

    return NextResponse.json({ ok: true, target, ...result });
  } catch (error) {
    await writeAuditLog({
      admin,
      request,
      eventType: "admin_action",
      action: `Failed to sync Google Sheets (${target})`,
      status: "blocked",
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to sync Google Sheets." },
      { status: 500 },
    );
  }
}
