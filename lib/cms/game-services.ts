import type { GameCatalogItem, GameService } from '@/lib/catalog'
import { listActiveCatalogGames } from '@/lib/cms/games'
import {
  getActiveServiceByGameAndSlug,
  listActiveServicesForGame,
  serviceRowToCatalogService,
  type ServiceRow,
} from '@/lib/cms/services'

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

export async function getServicesForGame(game: Pick<GameCatalogItem, 'slug'>) {
  return listActiveServicesForGame(game.slug)
}

export async function getCategoryServicesForGame(game: Pick<GameCatalogItem, 'slug'>, categorySlug: string) {
  const services = await getServicesForGame(game)
  return services.filter((service) => service.service_category_slug === categorySlug)
}

export async function getHotServicesForGame(game: Pick<GameCatalogItem, 'slug'>) {
  const services = await getServicesForGame(game)
  return services.filter((service) => service.is_hot_offer)
}

export async function getServiceForGame(game: Pick<GameCatalogItem, 'slug'>, serviceSlug: string) {
  return getActiveServiceByGameAndSlug(game.slug, serviceSlug)
}

export function serviceRowsToCatalogServices(services: ServiceRow[]) {
  return services.map(serviceRowToCatalogService)
}

export function getGameServiceDetailHref(service: Pick<GameService, 'gameSlug' | 'slug' | 'serviceCategorySlug'>) {
  if (service.serviceCategorySlug) {
    return `/${service.gameSlug}/${service.serviceCategorySlug}/${service.slug}`
  }

  return `/${service.gameSlug}/${service.slug}`
}
