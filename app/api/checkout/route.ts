import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { getCurrentUser } from '@/lib/auth/session'
import { getCurrentCartId, type CartItemRow } from '@/lib/cart'
import { snapshotFromCartItem } from '@/lib/checkout/snapshot'
import { cartItemToStripeProduct } from '@/lib/checkout/stripe-fulfillment'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripeClient } from '@/lib/stripe'

type CheckoutRequestBody = {
  currency?: string
}

export async function POST(request: Request) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Please log in to continue checkout.' }, { status: 401 })
  }

  if (!user.email_confirmed_at) {
    return NextResponse.json({ error: 'Please verify your email before checkout.' }, { status: 403 })
  }

  const body = (await request.json().catch(() => ({}))) as CheckoutRequestBody
  const currency = body.currency === 'EUR' ? 'EUR' : 'USD'
  const cartId = await getCurrentCartId()

  if (!cartId) {
    return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: cartItems, error: cartError } = await supabase
    .from('cart_items')
    .select('id, cart_id, service_id, selected_options, selected_options_snapshot, price_usd, price_eur, added_at, services(id, title, slug, image, description, base_price_usd, base_price_eur, options_schema, games(name, slug), service_categories(name, slug))')
    .eq('cart_id', cartId)
    .order('added_at', { ascending: true })
    .returns<CartItemRow[]>()

  if (cartError) {
    return NextResponse.json({ error: cartError.message }, { status: 500 })
  }

  if (!cartItems?.length) {
    return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 })
  }

  const origin = new URL(request.url).origin
  const stripe = getStripeClient()
  const snapshotItems = cartItems.map((item) => snapshotFromCartItem(item, cartItemToStripeProduct(item)))
  const cartFingerprint = `${user.id}:${cartId}:${cartItems.map((item) => `${item.id}:${item.added_at}:${item.price_usd}:${item.price_eur}`).join('|')}:${currency}`
  const checkoutFingerprint = createHash('sha256').update(cartFingerprint).digest('hex')
  const checkoutSessionId = `co_${checkoutFingerprint.slice(0, 32)}`
  const idempotencyKey = `checkout:${checkoutFingerprint}`
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email ?? undefined,
    client_reference_id: user.id,
    line_items: cartItems.map((item, index) => ({
      quantity: 1,
      price_data: {
        currency: currency.toLowerCase(),
        unit_amount: Math.max(50, Math.round((currency === 'EUR' ? Number(item.price_eur) : Number(item.price_usd)) * 100)),
        product_data: snapshotItems[index].product,
      },
    })),
    metadata: {
      cartId,
      checkoutSessionId,
      userId: user.id,
      currency,
    },
    success_url: `${origin}/order-confirmed?session={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout?canceled=1`,
  }, {
    idempotencyKey,
  })

  const { error: snapshotError } = await supabase.from('checkout_sessions').upsert({
    id: checkoutSessionId,
    cart_id: cartId,
    user_id: user.id,
    currency,
    provider: 'stripe',
    status: 'created',
    items: snapshotItems,
  })

  if (snapshotError) {
    return NextResponse.json({ error: snapshotError.message }, { status: 500 })
  }

  return NextResponse.json({
    checkoutSessionId,
    providerSessionId: session.id,
    redirectTo: session.url,
  })
}
