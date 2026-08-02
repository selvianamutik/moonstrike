import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/lib/admin/audit";
import { getAdminSession } from "@/lib/admin/session";
import { r2DeleteMany } from "@/lib/r2";

const allowedPrefixes = ["games/", "services/", "cms/", "admins/"];

function sanitizePaths(value: unknown) {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .filter((path): path is string => typeof path === "string")
        .map((path) => path.trim())
        .filter((path) => allowedPrefixes.some((prefix) => path.startsWith(prefix)) && !path.includes("..")),
    ),
  );
}

export async function DELETE(request: NextRequest) {
  const admin = await getAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { paths?: unknown } | null;
  const paths = sanitizePaths(body?.paths);

  if (paths.length === 0) {
    return NextResponse.json({ ok: true, deleted: 0 });
  }

  try {
    const deleted = await r2DeleteMany(paths);

    await writeAuditLog({
      action: `Cleaned up unsaved media: ${deleted} file${deleted === 1 ? "" : "s"}`,
      status: "success",
      request,
      admin,
      eventType: "cms",
    });

    return NextResponse.json({ ok: true, deleted });
  } catch (error) {
    await writeAuditLog({
      action: `Media cleanup failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      status: "critical",
      request,
      admin,
      eventType: "cms",
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed." },
      { status: 500 }
    );
  }
}
