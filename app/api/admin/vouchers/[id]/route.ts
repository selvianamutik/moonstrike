import { NextResponse, type NextRequest } from 'next/server'
import { writeAuditLog } from '@/lib/admin/audit'
import { getAdminSession } from '@/lib/admin/session'
import { deleteVoucher, updateVoucher, voucherErrorResponse } from '@/lib/vouchers/service'
import type { UpdateVoucherInput } from '@/lib/vouchers/types'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const input = await request.json().catch(() => null) as UpdateVoucherInput | null
  const { id } = await params

  if (!input || typeof input !== 'object') {
    return NextResponse.json({ error: 'Invalid voucher data.' }, { status: 400 })
  }

  if ('code' in input) {
    return NextResponse.json({ error: 'Voucher code cannot be changed.' }, { status: 400 })
  }

  try {
    const voucher = await updateVoucher(id, input)
    await writeAuditLog({
      action: `Updated voucher: ${voucher.code}`,
      status: 'success',
      request,
      admin,
      eventType: 'admin_action'
    })
    return NextResponse.json({ voucher })
  } catch (error) {
    const response = voucherErrorResponse(error)
    return NextResponse.json({ error: response.error }, { status: response.status })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { id } = await params

  try {
    await deleteVoucher(id)
    await writeAuditLog({
      action: `Deleted voucher: ${id}`,
      status: 'success',
      request,
      admin,
      eventType: 'admin_action'
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    const response = voucherErrorResponse(error)
    return NextResponse.json({ error: response.error }, { status: response.status })
  }
}
