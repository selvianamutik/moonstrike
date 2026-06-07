import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/session";
import { canRequestOrderRefund } from "@/lib/orders";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireVerifiedUser("/profile/orders");
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, user_id, status, completed_at, order_ref")
    .eq("id", id)
    .maybeSingle<{ id: string; user_id: string; status: string; completed_at: string | null; order_ref: string }>();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (!canRequestOrderRefund(order.status, order.completed_at)) {
    return NextResponse.json({ error: "Refund requests are available until 7 days after an order is completed." }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "refund_requested",
      refund_previous_status: order.status,
      refund_requested_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
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
