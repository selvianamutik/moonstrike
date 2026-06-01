import { NextResponse, type NextRequest } from 'next/server'
import { assertCartItemOwnership } from '@/lib/cart'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const owned = await assertCartItemOwnership(id)

  if (!owned) {
    return NextResponse.json({ error: 'Cart item not found.' }, { status: 404 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('cart_items').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', owned.cart_id)

  return NextResponse.json({ ok: true })
}
