import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'

type SuggestionItem = {
  href: string
  image: string | null
  title: string
  meta: string
  type: 'Game' | 'Service'
}

// Get last 3 services ordered by user, or 3 random active games if no orders
async function getSuggestionsForUser(userId: string): Promise<SuggestionItem[]> {
  const supabase = createAdminClient()

  // Try last 3 ordered services
  const { data: orderItems } = await supabase
    .from('order_items')
    .select(`
      services(
        title, slug, image,
        games(name, slug),
        service_categories(slug)
      ),
      orders!inner(user_id, created_at)
    `)
    .eq('orders.user_id', userId)
    .order('orders.created_at', { ascending: false })
    .limit(6) // fetch extra to dedupe

  if (orderItems && orderItems.length > 0) {
    const seen = new Set<string>()
    const suggestions: SuggestionItem[] = []

    for (const item of orderItems) {
      const svc = Array.isArray(item.services) ? item.services[0] : item.services
      if (!svc || !svc.slug) continue
      if (seen.has(svc.slug)) continue
      seen.add(svc.slug)

      const game = Array.isArray(svc.games) ? svc.games[0] : svc.games
      const cat = Array.isArray(svc.service_categories) ? svc.service_categories[0] : svc.service_categories
      
      // If game is null, the game was deleted - mark it
      if (!game) {
        suggestions.push({
          href: '#',
          image: null,
          title: '[Deleted]',
          meta: 'This game has been deleted',
          type: 'Service',
        })
      } else {
        const href = game.slug && cat?.slug ? `/${game.slug}/${cat.slug}/${svc.slug}` : `/${svc.slug}`
        suggestions.push({
          href,
          image: svc.image ?? null,
          title: svc.title,
          meta: game.name ?? 'Service',
          type: 'Service',
        })
      }

      if (suggestions.length >= 3) break
    }

    if (suggestions.length > 0) return suggestions
  }

  // Fallback: 3 random active games
  return getRandomGames()
}

async function getRandomGames(): Promise<SuggestionItem[]> {
  const supabase = createAdminClient()
  const { data: games } = await supabase
    .from('games')
    .select('name, slug, image')
    .eq('status', 'active')
    .limit(50)

  if (!games || games.length === 0) return []

  // shuffle and pick 3
  const shuffled = [...games].sort(() => Math.random() - 0.5).slice(0, 3)
  return shuffled.map((g) => ({
    href: `/${g.slug}`,
    image: g.image ?? null,
    title: g.name,
    meta: 'Game',
    type: 'Game' as const,
  }))
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  const userId = request.nextUrl.searchParams.get('userId') ?? user?.id ?? null

  try {
    const suggestions = userId
      ? await getSuggestionsForUser(userId)
      : await getRandomGames()

    return NextResponse.json({ suggestions })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load suggestions.' },
      { status: 500 }
    )
  }
}
