import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCartService, getCurrentCartId, getServiceCategory, getServiceGame, type CartItemRow } from '@/lib/cart'

export async function GET() {
  const cartId = await getCurrentCartId()

  if (!cartId) {
    return NextResponse.json({ items: [] })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('cart_items')
    .select(
      'id, cart_id, service_id, selected_options, selected_options_snapshot, price_usd, price_eur, added_at, services(id, title, slug, image, description, base_price_usd, base_price_eur, options_schema, games(name, slug), service_categories(name, slug))',
    )
    .eq('cart_id', cartId)
    .order('added_at', { ascending: false })
    .returns<CartItemRow[]>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    items: (data ?? []).map((item) => {
      const service = getCartService(item)
      const game = getServiceGame(service)
      const category = getServiceCategory(service)

      return {
        id: item.id,
        serviceId: item.service_id,
        selectedOptions: item.selected_options,
        selectedOptionsSnapshot: item.selected_options_snapshot,
        priceUSD: Number(item.price_usd),
        priceEUR: Number(item.price_eur),
        addedAt: item.added_at,
        service: service
          ? {
              id: service.id,
              title: service.title,
              slug: service.slug,
              image: service.image,
              description: service.description,
              gameName: game?.name ?? 'Game',
              gameSlug: game?.slug ?? '',
              categoryName: category?.name ?? 'Service',
              categorySlug: category?.slug ?? '',
            }
          : null,
      }
    }),
  })
}
