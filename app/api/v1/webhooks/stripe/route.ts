import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { writeAuditLog } from "@/lib/admin/audit";
import { fulfillStripeCheckoutSession } from "@/lib/checkout/stripe-fulfillment";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    await writeAuditLog({
      action: "Stripe webhook blocked: missing signature",
      status: "blocked",
      request,
      eventType: "payment_webhook",
      actorLabel: "System (Webhook)",
    });
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripeClient().webhooks.constructEvent(body, signature, getStripeWebhookSecret());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Stripe webhook signature.";
    await writeAuditLog({
      action: `Stripe webhook blocked: ${message}`,
      status: "blocked",
      request,
      eventType: "payment_webhook",
      actorLabel: "System (Webhook)",
    });
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    try {
      const result = await fulfillStripeCheckoutSession(event.data.object as Stripe.Checkout.Session);
      const checkoutSessionId = "checkoutSessionId" in result ? result.checkoutSessionId : event.id;
      await writeAuditLog({
        action: `Stripe webhook fulfilled ${checkoutSessionId}: ${result.status}`,
        status: "success",
        request,
        eventType: "payment_webhook",
        actorLabel: "System (Webhook)",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Stripe fulfillment failed.";
      await writeAuditLog({
        action: `Stripe webhook fulfillment failed for ${event.id}: ${message}`,
        status: "critical",
        request,
        eventType: "payment_webhook",
        actorLabel: "System (Webhook)",
      });
      throw error;
    }
  }

  return NextResponse.json({ received: true });
}
