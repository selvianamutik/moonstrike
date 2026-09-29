import { NextResponse, type NextRequest } from 'next/server'
import { writeAuditLog } from '@/lib/admin/audit'
import { getAdminSession } from '@/lib/admin/session'
import { createVoucher, listVouchers, voucherErrorResponse } from '@/lib/vouchers/service'
import type { CreateVoucherInput } from '@/lib/vouchers/types'

export async function GET() {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  try {
    return NextResponse.json({ vouchers: await listVouchers() })
  } catch (error) {
    const response = voucherErrorResponse(error)
    return NextResponse.json({ error: response.error }, { status: response.status })
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const input = await request.json().catch(() => null) as CreateVoucherInput | null

  if (!input || typeof input !== 'object') {
    return NextResponse.json({ error: 'Invalid voucher data.' }, { status: 400 })
  }

  try {
    const voucher = await createVoucher(input, admin.id)
    await writeAuditLog({
      action: `Created voucher: ${voucher.code}`,
      status: 'success',
      request,
      admin,
      eventType: 'admin_action'
    })
    return NextResponse.json({ voucher }, { status: 201 })
  } catch (error) {
    const response = voucherErrorResponse(error)
    return NextResponse.json({ error: response.error }, { status: response.status })
  }
}
