import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/lib/admin/audit";
import { getAdminSession } from "@/lib/admin/session";
import { getOrderNotificationContext, notifyRefundApproved } from "@/lib/notifications";
import { getPaymentProvider, ProviderRefundError } from "@/lib/payments/providers";
import type { PaymentProviderId, RefundMode } from "@/lib/payments/types";
import { createAdminClient } from "@/lib/supabase/admin";

function parseRefundAmount(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return NaN;
}

function parseRefundMode(value: unknown): RefundMode {
  return value === "manual" ? "manual" : "automatic";
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const amount = parseRefundAmount(body?.amount);
  const refundMode = parseRefundMode(body?.mode);

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
      provider: PaymentProviderId;
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
  const provider = getPaymentProvider(transaction.provider);
  let providerRefund;

  try {
    providerRefund = await provider.refund({
      order: {
        id: order.id,
        checkoutSessionId: order.checkout_session_id,
      },
      transaction: {
        providerPaymentId: transaction.provider_payment_id,
        currency: transaction.currency,
        rawProviderPayload: transaction.raw_provider_payload,
      },
      amount: normalizedAmount,
      mode: refundMode,
    });
  } catch (error) {
    if (error instanceof ProviderRefundError) {
      await writeAuditLog({
        action: `${provider.label} refund blocked for order ${order.order_ref}: ${error.message}`,
        status: "blocked",
        request,
        admin,
        eventType: "refund",
      });
      return NextResponse.json({ error: error.message, manualAvailable: provider.refundCapabilities.manual }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Automatic refund failed. No refund was recorded.";
    await writeAuditLog({
      action: `${provider.label} refund failed for order ${order.order_ref}: ${message}`,
      status: "critical",
      request,
      admin,
      eventType: "refund",
    });
    return NextResponse.json(
      {
        error: `${provider.label} refund failed: ${message}. No refund was recorded. You can complete the refund externally and record it manually.`,
        manualAvailable: provider.refundCapabilities.manual,
      },
      { status: 502 },
    );
  }

  const { error: updateTransactionError } = await supabase
    .from("transactions")
    .update({
      status: "refunded",
      refund_status: "refunded",
      provider_refund_id: providerRefund.providerRefundId,
      refund_amount: normalizedAmount,
      refund_currency: transaction.currency,
      refund_category: null,
      refund_note: null,
      refunded_at: refundedAt,
      raw_provider_payload: {
        ...(transaction.raw_provider_payload ?? {}),
        refund: {
          mode: refundMode,
          ...providerRefund.payload,
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
    action: providerRefund.manual
      ? `Recorded manual ${provider.label} refund for order ${order.id.slice(0, 8)}`
      : `Issued ${provider.label} refund ${providerRefund.providerRefundId} for order ${order.id.slice(0, 8)}`,
    status: "success",
    request,
    admin,
    eventType: "refund",
  });

  const notificationContext = await getOrderNotificationContext(order.id);
  if (notificationContext) {
    await notifyRefundApproved(notificationContext);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.id}`);
  revalidatePath(`/admin/orders/${order.order_ref}`);
  revalidatePath("/admin/transactions");
  revalidatePath("/profile");
  revalidatePath("/profile/orders");
  revalidatePath(`/profile/orders/${order.order_ref}`);
  revalidatePath("/profile/transactions");

  return NextResponse.json({ ok: true, refundId: providerRefund.providerRefundId, manual: providerRefund.manual });
}
