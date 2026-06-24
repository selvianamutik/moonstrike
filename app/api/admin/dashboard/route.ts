import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { getAdminDashboardData, type AdminDashboardPeriodDays } from "@/lib/admin/dashboard";

const periodOptions: AdminDashboardPeriodDays[] = [1, 7, 14, 30, 90, 180];

function parsePeriod(request: NextRequest): AdminDashboardPeriodDays {
  const parsed = Number(request.nextUrl.searchParams.get("days") ?? 30);
  return periodOptions.includes(parsed as AdminDashboardPeriodDays) ? (parsed as AdminDashboardPeriodDays) : 30;
}

export async function GET(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const dashboard = await getAdminDashboardData(parsePeriod(request));
    return NextResponse.json({ dashboard });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load dashboard." },
      { status: 500 },
    );
  }
}
