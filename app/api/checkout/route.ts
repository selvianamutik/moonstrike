import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/lib/admin/audit";
import { CheckoutError, createPaymentCheckout } from "@/lib/payments/checkout";

export async function POST(request: NextRequest) {
  try {
    const checkout = await createPaymentCheckout("stripe", request);
    await writeAuditLog({
      action: `Stripe checkout created ${checkout.checkoutSessionId}`,
      status: "success",
      request,
      eventType: "checkout",
      actorLabel: "System (Checkout)",
    });
    return NextResponse.json(checkout);
  } catch (error) {
    if (error instanceof CheckoutError) {
      await writeAuditLog({
        action: `Stripe checkout blocked: ${error.message}`,
        status: "blocked",
        request,
        eventType: "checkout",
        actorLabel: "System (Checkout)",
      });
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Unable to create checkout.";
    await writeAuditLog({
      action: `Stripe checkout failed: ${message}`,
      status: "critical",
      request,
      eventType: "checkout",
      actorLabel: "System (Checkout)",
    });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
