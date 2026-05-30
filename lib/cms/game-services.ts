import { gameServices, type GameCatalogItem, type GameService } from '@/lib/catalog'
import { listActiveCatalogGames } from '@/lib/cms/games'

export function serviceCategorySlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function getActiveGameBySlug(slug: string) {
  const games = await listActiveCatalogGames()
  return games.find((game) => game.slug === slug) ?? null
}

export function getServicesForGame(game: Pick<GameCatalogItem, 'slug'>) {
  return gameServices.filter((service) => service.gameSlug === game.slug)
}

export function getCategoryServicesForGame(game: Pick<GameCatalogItem, 'slug'>, categorySlug: string) {
  return getServicesForGame(game).filter(
    (service) => serviceCategorySlug(service.serviceCategory) === categorySlug
  )
}

export function getHotServicesForGame(game: Pick<GameCatalogItem, 'slug'>) {
  return getServicesForGame(game).filter((service) => service.isHotOffer)
}

export function getServiceForGame(game: Pick<GameCatalogItem, 'slug'>, serviceSlug: string) {
  return getServicesForGame(game).find((service) => service.slug === serviceSlug) ?? null
}

export function getGameServiceDetailHref(service: Pick<GameService, 'gameSlug' | 'slug'>) {
  return `/${service.gameSlug}/${service.slug}`
}
