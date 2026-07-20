import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { getPaymentSettings, updatePaymentSetting } from "@/lib/admin/payment-settings";

export async function GET(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const settings = await getPaymentSettings();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { method, tax_rate, tax_label, enabled } = body;
    
    if (!method) return NextResponse.json({ error: "Method is required" }, { status: 400 });

    await updatePaymentSetting(method, {
      ...(tax_rate !== undefined && { tax_rate: Number(tax_rate) }),
      ...(tax_label !== undefined && { tax_label: String(tax_label) }),
      ...(enabled !== undefined && { enabled: Boolean(enabled) })
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
