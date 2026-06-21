import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/lib/admin/audit";
import { requireVerifiedUser } from "@/lib/auth/session";
import { getOrderNotificationContext, notifyOrderCompleted } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireVerifiedUser("/profile/orders");
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, user_id, status, order_ref")
    .eq("id", id)
    .maybeSingle<{ id: string; user_id: string; status: string; order_ref: string }>();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.status !== "delivered") {
    await writeAuditLog({
      action: `Customer completion blocked for ${order.order_ref}: status ${order.status}`,
      status: "blocked",
      request,
      eventType: "order_lifecycle",
      actorLabel: user.email ?? "Customer",
    });
    return NextResponse.json({ error: "Only delivered orders can be confirmed as completed." }, { status: 400 });
  }

  const completedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "completed",
      completed_at: completedAt,
      updated_at: completedAt,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "delivered");

  if (updateError) {
    await writeAuditLog({
      action: `Customer completion failed for ${order.order_ref}: ${updateError.message}`,
      status: "critical",
      request,
      eventType: "order_lifecycle",
      actorLabel: user.email ?? "Customer",
    });
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await writeAuditLog({
    action: `Customer confirmed completion for ${order.order_ref}`,
    status: "success",
    request,
    eventType: "order_lifecycle",
    actorLabel: user.email ?? "Customer",
  });

  const notificationContext = await getOrderNotificationContext(order.id);
  if (notificationContext) {
    await notifyOrderCompleted(notificationContext);
  }

  revalidatePath("/profile");
  revalidatePath("/profile/orders");
  revalidatePath(`/profile/orders/${id}`);
  revalidatePath(`/profile/orders/${order.order_ref}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath(`/admin/orders/${order.order_ref}`);

  return NextResponse.json({ ok: true });
}
