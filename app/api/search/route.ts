import { NextResponse } from 'next/server'
import { getGameServiceDetailHref } from '@/lib/cms/game-services'
import { listActiveCatalogGames } from '@/lib/cms/games'
import { listActiveServices, serviceRowToCatalogService } from '@/lib/cms/services'

function normalize(value: string) {
  return value.toLowerCase().trim()
}

function includesQuery(values: Array<string | null | undefined>, query: string) {
  return values.some((value) => normalize(value ?? '').includes(query))
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = normalize(searchParams.get('q') ?? '')

  if (query.length < 2) {
    return NextResponse.json({ games: [], services: [] })
  }

  const [games, serviceRows] = await Promise.all([
    listActiveCatalogGames(),
    listActiveServices(),
  ])
  const services = serviceRows.map(serviceRowToCatalogService)

  const matchedGames = games
    .filter((game) =>
      includesQuery([game.name, game.genre, game.genreGroup, game.platform, game.description], query)
    )
    .slice(0, 5)

  const matchedGameSlugs = new Set(matchedGames.map((game) => game.slug))

  const matchedServices = services
    .filter((service) =>
      matchedGameSlugs.has(service.gameSlug) ||
      includesQuery(
        [
          service.name,
          service.offerTitle,
          service.gameName,
          service.serviceCategory,
          service.description,
          ...(service.tags ?? []),
        ],
        query,
      )
    )
    .slice(0, 8)

  return NextResponse.json({
    games: matchedGames.map((game) => ({
      href: `/${game.slug}`,
      image: game.image,
      meta: game.genre,
      title: game.name,
      type: 'Game',
    })),
    services: matchedServices.map((service) => ({
      href: getGameServiceDetailHref(service),
      image: service.image,
      meta: `${service.gameName} / ${service.serviceCategory}`,
      title: service.name,
      type: 'Service',
    })),
  })
}
