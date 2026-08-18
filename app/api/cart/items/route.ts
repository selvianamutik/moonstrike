import { NextResponse, type NextRequest } from 'next/server'
import { calculateCartSnapshot, getOrCreateCartId, touchCart } from '@/lib/cart'
import { createAdminClient } from '@/lib/supabase/admin'
import { usdToEur } from '@/lib/currency/convert'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)

  if (body?.privateOffer) {
    return handlePrivateOffer(body, request)
  }

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

  const missingRequired = validateRequiredOptions(service.options_schema, selectedOptions)

  if (missingRequired.length > 0) {
    return NextResponse.json(
      { error: `Please complete all required options: ${missingRequired.join(', ')}` },
      { status: 400 }
    )
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

  await touchCart(cartId)

  return NextResponse.json({ itemId: item.id })
}

function validateRequiredOptions(
  options: unknown,
  selected: Record<string, unknown>
): string[] {
  if (!Array.isArray(options)) return []

  return (options as Array<{ label?: unknown; type?: unknown; required?: unknown }>)
    .filter((option) => option?.required === true)
    .filter((option) => {
      const value = selected[String(option.label ?? '')]
      const type = String(option.type ?? '')

      if (type === 'text' || type === 'textarea') {
        return !(typeof value === 'string' && value.trim().length > 0)
      }

      if (type === 'checkbox_group' || type === 'multiple_choice') {
        return !(Array.isArray(value) && value.length > 0)
      }

      return value === undefined || value === null || value === ''
    })
    .map((option) => String(option.label ?? ''))
    .filter(Boolean)
}

async function handlePrivateOffer(body: Record<string, unknown>, _request: NextRequest) {
  const offerId = typeof body?.serviceId === 'string' ? body.serviceId.replace(/^private-/, '') : ''
  if (!offerId) {
    return NextResponse.json({ error: 'Missing private offer id.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: offer, error: offerError } = await supabase
    .from('private_offers')
    .select('id, title, slug, category, quantity, platform, additional_info, discount_percent, price_usd')
    .eq('id', offerId)
    .eq('status', 'active')
    .maybeSingle()

  if (offerError) {
    return NextResponse.json({ error: offerError.message }, { status: 500 })
  }

  if (!offer) {
    return NextResponse.json({ error: 'Private offer is not available.' }, { status: 404 })
  }

  const finalPrice = Number(offer.price_usd) * (1 - Number(offer.discount_percent) / 100)
  const finalPriceEUR = await usdToEur(finalPrice)
  const cartId = await getOrCreateCartId()

  const { data: item, error } = await supabase
    .from('cart_items')
    .insert({
      cart_id: cartId,
      service_id: null,
      private_offer_id: offer.id,
      selected_options: {},
      selected_options_snapshot: {},
      price_usd: finalPrice,
      price_eur: finalPriceEUR,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await touchCart(cartId)

  return NextResponse.json({ itemId: item.id })
}
