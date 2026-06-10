import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/lib/admin/audit";
import { CheckoutError, createPaymentCheckout } from "@/lib/payments/checkout";

export async function POST(request: NextRequest) {
  try {
    const checkout = await createPaymentCheckout("nowpayments", request);
    await writeAuditLog({
      action: `NOWPayments checkout created ${checkout.checkoutSessionId}`,
      status: "success",
      request,
      eventType: "checkout",
      actorLabel: "System (Checkout)",
    });
    return NextResponse.json(checkout);
  } catch (error) {
    if (error instanceof CheckoutError) {
      await writeAuditLog({
        action: `NOWPayments checkout blocked: ${error.message}`,
        status: "blocked",
        request,
        eventType: "checkout",
        actorLabel: "System (Checkout)",
      });
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Unable to create NOWPayments invoice.";
    await writeAuditLog({
      action: `NOWPayments checkout failed: ${message}`,
      status: "critical",
      request,
      eventType: "checkout",
      actorLabel: "System (Checkout)",
    });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
