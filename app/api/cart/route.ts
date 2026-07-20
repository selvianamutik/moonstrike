import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCartService, getCurrentCartId, getPrivateOffer, getPrivateOfferGame, getServiceCategory, getServiceGame, type CartItemRow } from '@/lib/cart'

export async function GET() {
  const cartId = await getCurrentCartId()

  if (!cartId) {
    return NextResponse.json({ items: [] })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('cart_items')
    .select(
      'id, cart_id, service_id, private_offer_id, selected_options, selected_options_snapshot, price_usd, price_eur, added_at, services(id, title, slug, image, description, base_price_usd, base_price_eur, options_schema, games(name, slug), service_categories(name, slug)), private_offers!left(id, title, slug, category, quantity, platform, additional_info, discount_percent, price_usd, games!inner(name, slug, image))',
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
      const privateOffer = getPrivateOffer(item)
      const privateOfferGame = getPrivateOfferGame(privateOffer)

      if (privateOffer) {
        return {
          id: item.id,
          serviceId: null,
          privateOfferId: item.private_offer_id,
          selectedOptions: item.selected_options,
          selectedOptionsSnapshot: item.selected_options_snapshot,
          priceUSD: Number(item.price_usd),
          priceEUR: Number(item.price_eur),
          addedAt: item.added_at,
          service: {
            id: privateOffer.id,
            title: privateOffer.title,
            slug: privateOffer.slug,
            image: privateOfferGame?.image ?? '',
            description: privateOffer.additional_info,
            gameName: privateOfferGame?.name ?? 'Game',
            gameSlug: privateOfferGame?.slug ?? '',
            categoryName: privateOffer.category,
            categorySlug: privateOffer.category,
          },
        }
      }

      return {
        id: item.id,
        serviceId: item.service_id,
        privateOfferId: null,
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
