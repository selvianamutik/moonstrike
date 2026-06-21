import { revalidatePath } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'
import { writeAuditLog } from '@/lib/admin/audit'
import { getAdminSession } from '@/lib/admin/session'
import { getOrderNotificationContext, notifyOrderCompleted, notifyOrderDelivered, notifyOrderStatusChanged, notifyRefundDenied } from '@/lib/notifications'
import { createAdminClient } from '@/lib/supabase/admin'

const ORDER_ACTIONS = new Set(['pending', 'confirmed', 'in_progress', 'delivered', 'completed', 'refund_requested', 'deny_refund', 'refunded'])

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  const status = typeof body?.status === 'string' ? body.status : ''

  if (!ORDER_ACTIONS.has(status)) {
    return NextResponse.json({ error: 'Invalid order status.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  let nextStatus = status
  let payload: Record<string, string | null> = { status }

  if (status === 'deny_refund') {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, checkout_session_id, refund_previous_status, order_ref')
      .eq('id', id)
      .maybeSingle<{ id: string; checkout_session_id: string; refund_previous_status: string | null; order_ref: string }>()

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    }

    nextStatus = order.refund_previous_status ?? 'in_progress'
    payload = {
      status: nextStatus,
      refund_previous_status: null,
    }

    await supabase
      .from('transactions')
      .update({
        refund_status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('checkout_session_id', order.checkout_session_id)
  }

  if (nextStatus === 'delivered') {
    payload.delivered_at = new Date().toISOString()
  }

  if (nextStatus === 'completed' && status !== 'deny_refund') {
    payload.completed_at = new Date().toISOString()
  }

  if (nextStatus === 'refund_requested') {
    payload.refund_requested_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('orders')
    .update(payload)
    .eq('id', id)
    .select('id, order_ref')
    .maybeSingle<{ id: string; order_ref: string }>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  }

  await writeAuditLog({
    action: status === 'deny_refund'
      ? `Denied refund for order ${id.slice(0, 8)} and restored status to ${nextStatus}`
      : `Updated order ${id.slice(0, 8)} status to ${nextStatus}`,
    status: 'success',
    request,
    admin,
  })

  const notificationContext = await getOrderNotificationContext(data.id)
  if (notificationContext) {
    if (nextStatus === 'confirmed' || nextStatus === 'in_progress') {
      await notifyOrderStatusChanged(notificationContext, nextStatus)
    }

    if (nextStatus === 'delivered') {
      await notifyOrderDelivered(notificationContext)
    }

    if (nextStatus === 'completed' && status !== 'deny_refund') {
      await notifyOrderCompleted(notificationContext)
    }

    if (status === 'deny_refund') {
      await notifyRefundDenied(notificationContext)
    }
  }

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${id}`)
  revalidatePath(`/admin/orders/${data.order_ref}`)

  return NextResponse.json({ ok: true, status: nextStatus })
}
