import { NextResponse, type NextRequest } from 'next/server'
import { calculateCartSnapshot, getOrCreateCartId } from '@/lib/cart'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const serviceId = typeof body?.serviceId === 'string' ? body.serviceId : ''
  const selectedOptions =
    body?.selectedOptions && typeof body.selectedOptions === 'object' && !Array.isArray(body.selectedOptions)
      ? body.selectedOptions
      : {}

  if (!serviceId) {
    return NextResponse.json({ error: 'Missing service id.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id, base_price_usd, base_price_eur, options_schema, status')
    .eq('id', serviceId)
    .maybeSingle()

  if (serviceError) {
    return NextResponse.json({ error: serviceError.message }, { status: 500 })
  }

  if (!service || service.status !== 'active') {
    return NextResponse.json({ error: 'Service is not available.' }, { status: 404 })
  }

  const cartId = await getOrCreateCartId()
  const snapshot = calculateCartSnapshot(service, selectedOptions)

  const { data: item, error } = await supabase
    .from('cart_items')
    .insert({
      cart_id: cartId,
      service_id: service.id,
      selected_options: snapshot.selectedOptions,
      selected_options_snapshot: snapshot.snapshot,
      price_usd: snapshot.priceUSD,
      price_eur: snapshot.priceEUR,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cartId)

  return NextResponse.json({ itemId: item.id })
}
