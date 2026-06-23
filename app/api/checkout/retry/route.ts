import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/lib/admin/audit";
import { CheckoutError, createPaymentCheckout } from "@/lib/payments/checkout";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please log in to continue checkout." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({})) as { sessionId?: string; currency?: string };
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;

    // If a sessionId is provided, check its status first
    if (sessionId) {
      const supabase = createAdminClient();
      const { data: existingSession } = await supabase
        .from("checkout_sessions")
        .select("id, user_id, status, provider, fulfilled_at")
        .eq("id", sessionId)
        .maybeSingle<{
          id: string;
          user_id: string;
          status: string;
          provider: string;
          fulfilled_at: string | null;
        }>();

      if (existingSession) {
        // Verify ownership
        if (existingSession.user_id !== user.id) {
          return NextResponse.json(
            { error: "Session does not belong to this user." },
            { status: 403 }
          );
        }

        // If already fulfilled, no need to retry
        if (existingSession.status === "fulfilled" || existingSession.fulfilled_at) {
          return NextResponse.json(
            { error: "This session has already been fulfilled. Check your orders." },
            { status: 409 }
          );
        }

        await writeAuditLog({
          action: `Stripe checkout retry initiated for expired session ${sessionId}`,
          status: "success",
          request,
          eventType: "checkout",
          actorLabel: user.email ?? user.id,
        });
      }
    }

    // Create a new checkout session (always Stripe for retry)
    const checkout = await createPaymentCheckout("stripe", request);

    await writeAuditLog({
      action: `Stripe checkout retry created ${checkout.checkoutSessionId}`,
      status: "success",
      request,
      eventType: "checkout",
      actorLabel: user.email ?? user.id,
    });

    return NextResponse.json(checkout);
  } catch (error) {
    if (error instanceof CheckoutError) {
      await writeAuditLog({
        action: `Stripe checkout retry blocked: ${error.message}`,
        status: "blocked",
        request,
        eventType: "checkout",
        actorLabel: "System (Checkout)",
      });
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Unable to retry checkout.";
    await writeAuditLog({
      action: `Stripe checkout retry failed: ${message}`,
      status: "critical",
      request,
      eventType: "checkout",
      actorLabel: "System (Checkout)",
    });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
