import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

const BLOCKED_REFUND_STATUSES = new Set(["completed", "refund_requested", "refunded"]);

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireVerifiedUser("/profile/orders");
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, user_id, status")
    .eq("id", id)
    .maybeSingle<{ id: string; user_id: string; status: string }>();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (BLOCKED_REFUND_STATUSES.has(order.status)) {
    return NextResponse.json({ error: "This order cannot request a refund from its current status." }, { status: 400 });
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
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);

  return NextResponse.json({ ok: true });
}
