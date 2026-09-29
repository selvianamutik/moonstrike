import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getOrCreateCartId, getCurrentCartId } from '@/lib/cart'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateVoucherCode, VoucherServiceError } from '@/lib/vouchers/service'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { code?: unknown } | null

  if (!body || typeof body.code !== 'string' || !body.code.trim()) {
    return NextResponse.json({ error: 'Please enter a voucher code.' }, { status: 400 })
  }

  try {
    const user = await getCurrentUser()
    const voucher = await validateVoucherCode(body.code, user?.id)
    const cartId = await getOrCreateCartId()
    const supabase = createAdminClient()

    const { error: updateError } = await supabase
      .from('carts')
      .update({
        voucher_id: voucher.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cartId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to apply voucher to cart.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      voucher: {
        code: voucher.code,
        discountPercentage: voucher.discountPercentage,
      },
    })
  } catch (error) {
    if (error instanceof VoucherServiceError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Unable to apply voucher.' }, { status: 400 })
  }
}

export async function DELETE() {
  const cartId = await getCurrentCartId()
  if (!cartId) {
    return NextResponse.json({ success: true })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('carts')
    .update({
      voucher_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cartId)

  if (error) {
    return NextResponse.json({ error: 'Failed to remove voucher.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
