import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import {
  buildOptionsSchema,
  DEFAULT_REQUIREMENTS,
  DEFAULT_WHAT_YOU_GET,
  jokiGames,
  resolveServicePricing,
} from './data/joki-game-v3.mjs'

function loadLocalEnv() {
  const envFiles = ['.env.local', '.env']
  
  for (const envFile of envFiles) {
    const envPath = path.join(process.cwd(), envFile)
    if (!fs.existsSync(envPath)) continue

    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const equalsIndex = trimmed.indexOf('=')
    if (equalsIndex === -1) continue

    const key = trimmed.slice(0, equalsIndex).trim()
    let value = trimmed.slice(equalsIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[key] ??= value
    }
  }
}

function required(value, name) {
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

loadLocalEnv()

const supabaseUrl = required(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = required(
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  'SUPABASE_SECRET_KEY'
)

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function upsert(table, rows, onConflict) {
  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict, ignoreDuplicates: false })

  if (error) throw error
}

function serviceDescription(game, serviceDef) {
  if (serviceDef.description) return serviceDef.description

  const maxUsd = serviceDef.base_price_usd_max
  const maxEur = serviceDef.base_price_eur_max
  const priceNote =
    maxUsd > serviceDef.base_price_usd
      ? ` Reference pricing from $${serviceDef.base_price_usd.toFixed(2)}–$${maxUsd.toFixed(2)} / €${serviceDef.base_price_eur.toFixed(2)}–€${maxEur.toFixed(2)}.`
      : ` Reference pricing from $${serviceDef.base_price_usd.toFixed(2)} / €${serviceDef.base_price_eur.toFixed(2)}.`

  return `${serviceDef.title} for ${game.name}, handled by verified boosters with configurable speed tier, work mode, and add-ons.${priceNote}`
}

async function main() {
  const genres = Array.from(new Set(jokiGames.map((game) => game.genre)))

  await upsert(
    'genres',
    genres.map((name) => ({ name, slug: slugify(name) })),
    'slug'
  )

  const { data: genreRows, error: genreError } = await supabase
    .from('genres')
    .select('id, name')

  if (genreError) throw genreError

  const genreByName = new Map(genreRows.map((genre) => [genre.name, genre]))

  await upsert(
    'games',
    jokiGames.map((game) => ({
      name: game.name,
      slug: game.slug,
      image: game.image,
      hero_image: game.image,
      genre_id: genreByName.get(game.genre)?.id,
      platforms: game.platforms,
      description: game.description,
      status: 'active',
    })),
    'slug'
  )

  const { data: gameRows, error: gameError } = await supabase
    .from('games')
    .select('id, slug, name')
    .in(
      'slug',
      jokiGames.map((game) => game.slug)
    )

  if (gameError) throw gameError

  const gameBySlug = new Map(gameRows.map((game) => [game.slug, game]))

  const categoryRows = jokiGames.flatMap((game) => {
    const gameRow = gameBySlug.get(game.slug)
    if (!gameRow) return []

    const categories = new Map()
    categories.set('uncategorized', { name: 'Uncategorized', slug: 'uncategorized', sort_order: 999 })

    game.services.forEach((serviceDef, index) => {
      const slug = slugify(serviceDef.category)
      if (!categories.has(slug)) {
        categories.set(slug, {
          name: serviceDef.category,
          slug,
          sort_order: index,
        })
      }
    })

    return Array.from(categories.values()).map((category) => ({
      game_id: gameRow.id,
      name: category.name,
      slug: category.slug,
      sort_order: category.sort_order,
    }))
  })

  await upsert('service_categories', categoryRows, 'game_id,slug')

  const { data: serviceCategoryRows, error: categoryError } = await supabase
    .from('service_categories')
    .select('id, game_id, slug')

  if (categoryError) throw categoryError

  const categoryByGameAndSlug = new Map(
    serviceCategoryRows.map((category) => [`${category.game_id}:${category.slug}`, category])
  )

  const serviceRows = jokiGames.flatMap((game) => {
    const gameRow = gameBySlug.get(game.slug)
    if (!gameRow) return []

    return game.services.map((serviceDef) => {
      const category =
        categoryByGameAndSlug.get(`${gameRow.id}:${slugify(serviceDef.category)}`) ||
        categoryByGameAndSlug.get(`${gameRow.id}:uncategorized`)

      const pricing = resolveServicePricing(serviceDef)

      return {
        game_id: gameRow.id,
        title: serviceDef.title,
        slug: serviceDef.slug,
        image: game.image,
        description: serviceDescription(game, serviceDef),
        service_category_id: category?.id,
        status: 'active',
        is_hot_offer: serviceDef.hot ?? false,
        badges: serviceDef.badges?.length ? serviceDef.badges : ['Safe & Secure', 'Progress Updates'],
        requirements: DEFAULT_REQUIREMENTS,
        what_you_get: DEFAULT_WHAT_YOU_GET,
        base_price_usd: pricing.base_price_usd,
        base_price_eur: pricing.base_price_eur,
        options_schema: buildOptionsSchema(serviceDef, pricing),
      }
    })
  })

  await upsert('services', serviceRows, 'game_id,slug')

  console.log(`Seeded ${jokiGames.length} joki reference games.`)
  console.log(`Seeded ${serviceRows.length} services from docs/data_joki_game-v3.md.`)
  console.log('Cover images mapped from public/cover-game/.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
