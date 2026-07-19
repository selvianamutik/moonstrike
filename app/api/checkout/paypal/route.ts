import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/lib/admin/audit";
import { CheckoutError, createPaymentCheckout } from "@/lib/payments/checkout";

export async function POST(request: NextRequest) {
  try {
    const checkout = await createPaymentCheckout("paypal", request);
    
    await writeAuditLog({
      action: `PayPal checkout created ${checkout.checkoutSessionId}`,
      status: "success",
      request,
      eventType: "checkout",
      actorLabel: "System (Checkout)",
    });
    return NextResponse.json(checkout);
  } catch (error) {
    if (error instanceof CheckoutError) {
      await writeAuditLog({
        action: `PayPal checkout blocked: ${error.message}`,
        status: "blocked",
        request,
        eventType: "checkout",
        actorLabel: "System (Checkout)",
      });
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Unable to create PayPal checkout.";
    
    await writeAuditLog({
      action: `PayPal checkout failed: ${message}`,
      status: "critical",
      request,
      eventType: "checkout",
      actorLabel: "System (Checkout)",
    });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
