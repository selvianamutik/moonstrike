import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/lib/admin/audit";
import { getAdminSession } from "@/lib/admin/session";
import { getStripeClient } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const REFUND_CATEGORIES = new Set(["customer_request", "duplicate_order", "service_unavailable", "admin_adjustment", "suspected_fraud", "other"]);

function parseRefundAmount(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return NaN;
}

function toStripeReason(category: string) {
  if (category === "duplicate_order") return "duplicate" as const;
  if (category === "suspected_fraud") return "fraudulent" as const;
  return "requested_by_customer" as const;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const amount = parseRefundAmount(body?.amount);
  const category = typeof body?.category === "string" ? body.category : "";
  const note = typeof body?.note === "string" ? body.note.trim() : "";

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Refund amount must be greater than 0." }, { status: 400 });
  }

  if (!REFUND_CATEGORIES.has(category)) {
    return NextResponse.json({ error: "Choose a valid refund category." }, { status: 400 });
  }

  if (note.length > 500) {
    return NextResponse.json({ error: "Refund note must be 500 characters or fewer." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, checkout_session_id, total, currency, payment_provider, status")
    .eq("id", id)
    .maybeSingle<{
      id: string;
      checkout_session_id: string;
      total: number | string;
      currency: "USD" | "EUR";
      payment_provider: "stripe" | "nowpayments";
      status: string;
    }>();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.payment_provider !== "stripe") {
    return NextResponse.json({ error: "Automatic refunds are only wired for Stripe orders." }, { status: 400 });
  }

  if (order.status === "refunded") {
    return NextResponse.json({ error: "This order is already marked as refunded." }, { status: 400 });
  }

  const orderTotal = Number(order.total);
  if (amount > orderTotal) {
    return NextResponse.json({ error: "Refund amount cannot be higher than the order total." }, { status: 400 });
  }

  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .select("id, provider_payment_id, amount, currency, refund_status, raw_provider_payload")
    .eq("checkout_session_id", order.checkout_session_id)
    .maybeSingle<{
      id: string;
      provider_payment_id: string;
      amount: number | string;
      currency: "USD" | "EUR";
      refund_status: string;
      raw_provider_payload: Record<string, unknown> | null;
    }>();

  if (transactionError) {
    return NextResponse.json({ error: transactionError.message }, { status: 500 });
  }

  if (!transaction) {
    return NextResponse.json({ error: "Transaction record not found for this order." }, { status: 404 });
  }

  if (transaction.refund_status === "refunded") {
    return NextResponse.json({ error: "This transaction is already marked as refunded." }, { status: 400 });
  }

  const maxTransactionAmount = Number(transaction.amount);
  if (amount > maxTransactionAmount) {
    return NextResponse.json({ error: "Refund amount cannot be higher than the transaction amount." }, { status: 400 });
  }

  const normalizedAmount = Math.round(amount * 100) / 100;
  const amountInCents = Math.round(normalizedAmount * 100);
  const refund = await getStripeClient().refunds.create({
    payment_intent: transaction.provider_payment_id,
    amount: amountInCents,
    reason: toStripeReason(category),
    metadata: {
      order_id: order.id,
      checkout_session_id: order.checkout_session_id,
      category,
      note,
    },
  });

  const refundedAt = new Date().toISOString();
  const { error: updateTransactionError } = await supabase
    .from("transactions")
    .update({
      status: "refunded",
      refund_status: "refunded",
      provider_refund_id: refund.id,
      refund_amount: normalizedAmount,
      refund_currency: order.currency,
      refund_category: category,
      refund_note: note || null,
      refunded_at: refundedAt,
      raw_provider_payload: {
        ...(transaction.raw_provider_payload ?? {}),
        refund: {
          id: refund.id,
          amount: refund.amount,
          currency: refund.currency,
          status: refund.status,
          reason: refund.reason,
        },
      },
      updated_at: refundedAt,
    })
    .eq("id", transaction.id);

  if (updateTransactionError) {
    return NextResponse.json({ error: updateTransactionError.message }, { status: 500 });
  }

  const { error: updateOrderError } = await supabase
    .from("orders")
    .update({
      status: "refunded",
      updated_at: refundedAt,
    })
    .eq("id", order.id);

  if (updateOrderError) {
    return NextResponse.json({ error: updateOrderError.message }, { status: 500 });
  }

  await writeAuditLog({
    action: `Issued Stripe refund ${refund.id} for order ${order.id.slice(0, 8)}`,
    status: "success",
    request,
    admin,
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.id}`);
  revalidatePath("/admin/transactions");
  revalidatePath("/profile");
  revalidatePath("/profile/orders");
  revalidatePath(`/profile/orders/${order.id}`);
  revalidatePath("/profile/transactions");

  return NextResponse.json({ ok: true, refundId: refund.id });
}
