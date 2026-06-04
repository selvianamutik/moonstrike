import { NextResponse, type NextRequest } from "next/server";
import { fulfillNowPaymentsCheckout, type NowPaymentsIpnPayload } from "@/lib/checkout/nowpayments-fulfillment";
import { verifyNowPaymentsIpnSignature } from "@/lib/nowpayments";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  let payload: NowPaymentsIpnPayload;

  try {
    payload = JSON.parse(rawBody) as NowPaymentsIpnPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const signature = request.headers.get("x-nowpayments-sig");

  if (!verifyNowPaymentsIpnSignature(payload, signature)) {
    return NextResponse.json({ error: "Invalid NOWPayments signature." }, { status: 400 });
  }

  await fulfillNowPaymentsCheckout(payload);

  return NextResponse.json({ received: true });
}
