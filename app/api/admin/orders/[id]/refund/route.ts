import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/lib/admin/audit";
import { getAdminSession } from "@/lib/admin/session";
import { getStripeClient } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

function parseRefundAmount(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return NaN;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const amount = parseRefundAmount(body?.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Refund amount must be greater than 0." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, checkout_session_id, status, order_ref")
    .eq("id", id)
    .maybeSingle<{
      id: string;
      checkout_session_id: string;
      status: string;
      order_ref: string;
    }>();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.status === "refunded") {
    return NextResponse.json({ error: "This order is already marked as refunded." }, { status: 400 });
  }

  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .select("id, provider, provider_payment_id, amount, currency, refund_status, raw_provider_payload")
    .eq("checkout_session_id", order.checkout_session_id)
    .maybeSingle<{
      id: string;
      provider: "stripe" | "nowpayments";
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
  const refundedAt = new Date().toISOString();
  const providerRefund =
    transaction.provider === "stripe"
      ? await getStripeClient().refunds.create({
          payment_intent: transaction.provider_payment_id,
          amount: Math.round(normalizedAmount * 100),
          reason: "requested_by_customer",
          metadata: {
            order_id: order.id,
            checkout_session_id: order.checkout_session_id,
          },
        })
      : null;

  const { error: updateTransactionError } = await supabase
    .from("transactions")
    .update({
      status: "refunded",
      refund_status: "refunded",
      provider_refund_id: providerRefund?.id ?? null,
      refund_amount: normalizedAmount,
      refund_currency: transaction.currency,
      refund_category: null,
      refund_note: null,
      refunded_at: refundedAt,
      raw_provider_payload: {
        ...(transaction.raw_provider_payload ?? {}),
        refund: providerRefund
          ? {
              id: providerRefund.id,
              amount: providerRefund.amount,
              currency: providerRefund.currency,
              status: providerRefund.status,
              reason: providerRefund.reason,
            }
          : {
              manual: true,
              provider: transaction.provider,
              amount: normalizedAmount,
              currency: transaction.currency,
              recorded_at: refundedAt,
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
    action: providerRefund
      ? `Issued Stripe refund ${providerRefund.id} for order ${order.id.slice(0, 8)}`
      : `Recorded manual ${transaction.provider} refund for order ${order.id.slice(0, 8)}`,
    status: "success",
    request,
    admin,
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.id}`);
  revalidatePath(`/admin/orders/${order.order_ref}`);
  revalidatePath("/admin/transactions");
  revalidatePath("/profile");
  revalidatePath("/profile/orders");
  revalidatePath(`/profile/orders/${order.order_ref}`);
  revalidatePath("/profile/transactions");

  return NextResponse.json({ ok: true, refundId: providerRefund?.id ?? null, manual: !providerRefund });
}
