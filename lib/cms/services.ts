import type { GameService } from '@/lib/catalog'
import type { ServiceCategoryRow } from '@/lib/cms/service-categories'
import { createAdminClient } from '@/lib/supabase/admin'

export type ServiceStatus = 'active' | 'draft' | 'archived'
export type ServiceBenefit = { icon: string; title: string; description: string }
export type ServiceOption = {
  id?: string
  label: string
  type: 'single_choice' | 'multiple_choice' | 'scalar'
  required: boolean
  options?: Array<{ label: string; priceUSD: number; priceEUR: number }>
  min?: number
  max?: number
  pricePerUnitUSD?: number
  pricePerUnitEUR?: number
}

export type ServiceRow = {
  id: string
  game_id: string
  game_name: string
  game_slug: string
  title: string
  slug: string
  image: string
  description: string
  service_category_id: string | null
  service_category_name: string | null
  service_category_slug: string | null
  status: ServiceStatus
  is_hot_offer: boolean
  hot_offer_at: string | null
  region: string[]
  badges: string[]
  requirements: string[]
  what_you_get: ServiceBenefit[]
  base_price_usd: number
  base_price_eur: number
  options_schema: ServiceOption[]
  created_at: string
  updated_at: string
}

type RawServiceRow = Omit<
  ServiceRow,
  | 'game_name'
  | 'game_slug'
  | 'service_category_name'
  | 'service_category_slug'
  | 'base_price_usd'
  | 'base_price_eur'
  | 'what_you_get'
  | 'options_schema'
> & {
  base_price_usd: string | number
  base_price_eur: string | number
  what_you_get: unknown
  options_schema: unknown
  games: { name: string; slug: string } | { name: string; slug: string }[] | null
  service_categories:
    | { name: string; slug: string }
    | { name: string; slug: string }[]
    | null
}

const SERVICE_SELECT =
  'id, game_id, games(name, slug), title, slug, image, description, service_category_id, service_categories(name, slug), status, is_hot_offer, hot_offer_at, region, badges, requirements, what_you_get, base_price_usd, base_price_eur, options_schema, created_at, updated_at'

function relationOne<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function asArray<T>(value: unknown, fallback: T[] = []) {
  return Array.isArray(value) ? (value as T[]) : fallback
}

export function serviceRowToCatalogService(row: ServiceRow): GameService {
  return {
    slug: row.slug,
    gameSlug: row.game_slug,
    gameName: row.game_name,
    name: row.title,
    offerTitle: row.title,
    category: row.service_category_name ?? 'Service',
    serviceCategory: row.service_category_name ?? 'Uncategorized',
    serviceCategorySlug: row.service_category_slug,
    image: row.image,
    description: row.description,
    startingPrice: row.base_price_usd,
    isHotOffer: row.is_hot_offer,
    tags: row.badges,
  }
}

function rawServiceToRow(row: RawServiceRow): ServiceRow {
  const game = relationOne(row.games)
  const category = relationOne(row.service_categories)

  return {
    id: row.id,
    game_id: row.game_id,
    game_name: game?.name ?? 'Unknown Game',
    game_slug: game?.slug ?? '',
    title: row.title,
    slug: row.slug,
    image: row.image,
    description: row.description,
    service_category_id: row.service_category_id,
    service_category_name: category?.name ?? null,
    service_category_slug: category?.slug ?? null,
    status: row.status,
    is_hot_offer: row.is_hot_offer,
    hot_offer_at: row.hot_offer_at,
    region: row.region,
    badges: row.badges,
    requirements: row.requirements,
    what_you_get: asArray<ServiceBenefit>(row.what_you_get),
    base_price_usd: Number(row.base_price_usd),
    base_price_eur: Number(row.base_price_eur),
    options_schema: asArray<ServiceOption>(row.options_schema),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export function slugifyService(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function listAdminServices() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('services')
    .select(SERVICE_SELECT)
    .order('updated_at', { ascending: false })
    .returns<RawServiceRow[]>()

  if (error) throw error

  return (data ?? []).map(rawServiceToRow)
}

export async function listActiveServicesForGame(gameSlug: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('services')
    .select(SERVICE_SELECT)
    .eq('status', 'active')
    .eq('games.slug', gameSlug)
    .order('title', { ascending: true })
    .returns<RawServiceRow[]>()

  if (error) throw error

  return (data ?? []).map(rawServiceToRow).filter((service) => service.game_slug === gameSlug)
}

export async function getAdminService(id: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('services')
    .select(SERVICE_SELECT)
    .eq('id', id)
    .maybeSingle<RawServiceRow>()

  if (error) throw error

  return data ? rawServiceToRow(data) : null
}

export async function getActiveServiceByGameAndSlug(gameSlug: string, serviceSlug: string) {
  const services = await listActiveServicesForGame(gameSlug)
  return services.find((service) => service.slug === serviceSlug) ?? null
}
