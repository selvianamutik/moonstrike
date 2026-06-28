import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/lib/admin/audit";
import { tickHeroBannerStatusTransitions } from "@/lib/cms/hero-banners";

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
      action: "Hero banner status cron blocked: unauthorized request",
      status: "blocked",
      request,
      eventType: "cron",
      actorLabel: "System (Cron)",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let results;

  try {
    results = await tickHeroBannerStatusTransitions();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Status transition failed.";
    await writeAuditLog({
      action: `Hero banner status cron failed: ${message}`,
      status: "critical",
      request,
      eventType: "cron",
      actorLabel: "System (Cron)",
    });
    throw error;
  }

  await writeAuditLog({
    action: `Hero banner status cron completed: ${results.activated} activated, ${results.archived} archived`,
    status: "success",
    request,
    eventType: "cron",
    actorLabel: "System (Cron)",
  });

  if (results.activated > 0 || results.archived > 0) {
    revalidatePath("/");
    revalidatePath("/admin/content");
  }

  return NextResponse.json({ ok: true, ...results });
}
