import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/lib/admin/audit";
import { fulfillNowPaymentsCheckout, type NowPaymentsIpnPayload } from "@/lib/checkout/nowpayments-fulfillment";
import { verifyNowPaymentsIpnSignature } from "@/lib/nowpayments";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  let payload: NowPaymentsIpnPayload;

  try {
    payload = JSON.parse(rawBody) as NowPaymentsIpnPayload;
  } catch {
    await writeAuditLog({
      action: "NOWPayments webhook blocked: invalid JSON body",
      status: "blocked",
      request,
      eventType: "payment_webhook",
      actorLabel: "System (Webhook)",
    });
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const signature = request.headers.get("x-nowpayments-sig");

  if (!verifyNowPaymentsIpnSignature(payload, signature)) {
    await writeAuditLog({
      action: `NOWPayments webhook blocked: invalid signature for ${payload.order_id ?? "unknown order"}`,
      status: "blocked",
      request,
      eventType: "payment_webhook",
      actorLabel: "System (Webhook)",
    });
    return NextResponse.json({ error: "Invalid NOWPayments signature." }, { status: 400 });
  }

  try {
    const result = await fulfillNowPaymentsCheckout(payload);
    await writeAuditLog({
      action: `NOWPayments webhook handled ${payload.order_id ?? "unknown order"}: ${result.status}`,
      status: "success",
      request,
      eventType: "payment_webhook",
      actorLabel: "System (Webhook)",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "NOWPayments fulfillment failed.";
    await writeAuditLog({
      action: `NOWPayments webhook fulfillment failed for ${payload.order_id ?? "unknown order"}: ${message}`,
      status: "critical",
      request,
      eventType: "payment_webhook",
      actorLabel: "System (Webhook)",
    });
    throw error;
  }

  return NextResponse.json({ received: true });
}
