import { NextResponse } from 'next/server'
import { validateVoucherCode, VoucherServiceError } from '@/lib/vouchers/service'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { code?: unknown } | null

  if (!body || typeof body.code !== 'string' || !body.code.trim()) {
    return NextResponse.json({ error: 'Invalid voucher code' }, { status: 400 })
  }

  try {
    const voucher = await validateVoucherCode(body.code)
    return NextResponse.json({
      code: voucher.code,
      discountPercentage: voucher.discountPercentage
    })
  } catch (error) {
    if (error instanceof VoucherServiceError && (error.code === 'not_found' || error.code === 'expired')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Invalid voucher code' }, { status: 400 })
  }
}
