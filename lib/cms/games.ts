import { supportedGames, type GameCatalogItem } from '@/lib/catalog'
import { ensureDefaultGenres, normalizeGameGenre, type GenreRow } from '@/lib/cms/genres'
import { createAdminClient } from '@/lib/supabase/admin'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type GameStatus = 'active' | 'draft' | 'archived'

export type GameRow = {
  id: string
  name: string
  slug: string
  image: string
  genre_id: string
  genre: string
  platforms: string[]
  description: string
  status: GameStatus
  created_at: string
  updated_at: string
}

type RawGameRow = Omit<GameRow, 'genre'> & {
  genres: GenreRow | GenreRow[] | null
  genre?: string | null
}

const GAME_SELECT =
  'id, name, slug, image, genre_id, genres(id, name, slug, created_at), platforms, description, status, created_at, updated_at'

function genreGroupFromGenre(genre: string) {
  const value = genre.toLowerCase()

  if (value.includes('mmo')) return 'MMO'
  if (value.includes('moba')) return 'MOBA'
  if (value.includes('shooter') || value.includes('fps') || value.includes('battle')) {
    return 'Shooters'
  }

  return 'Action RPG'
}

function relationGenreName(row: RawGameRow) {
  const relation = Array.isArray(row.genres) ? row.genres[0] : row.genres
  return relation?.name ?? row.genre ?? ''
}

function rawGameRowToGameRow(row: RawGameRow): GameRow {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    image: row.image,
    genre_id: row.genre_id,
    genre: normalizeGameGenre(relationGenreName(row)),
    platforms: row.platforms,
    description: row.description,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export function gameRowToCatalogItem(row: GameRow): GameCatalogItem {
  const genre = normalizeGameGenre(row.genre)

  return {
    slug: row.slug,
    name: row.name,
    genre,
    genreGroup: genreGroupFromGenre(genre),
    platform: row.platforms[0] ?? 'Cross-play',
    description: row.description,
    image: row.image,
    isTopTitle: row.status === 'active',
  }
}

export async function listAdminGames() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('games')
    .select(GAME_SELECT)
    .order('updated_at', { ascending: false })
    .returns<RawGameRow[]>()

  if (error) throw error

  return (data ?? []).map(rawGameRowToGameRow)
}

export async function listActiveCatalogGames() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('games')
    .select(GAME_SELECT)
    .eq('status', 'active')
    .order('name', { ascending: true })
    .returns<RawGameRow[]>()

  if (error) {
    console.error('Failed to load CMS games', error.message)
    return supportedGames
  }

  if (!data || data.length === 0) return supportedGames

  return data.map(rawGameRowToGameRow).map(gameRowToCatalogItem)
}

export async function getAdminGame(idOrSlug: string) {
  const supabase = createAdminClient()

  if (UUID_PATTERN.test(idOrSlug)) {
    const { data: byId, error: idError } = await supabase
      .from('games')
      .select(GAME_SELECT)
      .eq('id', idOrSlug)
      .maybeSingle<RawGameRow>()

    if (idError) throw idError
    if (byId) return rawGameRowToGameRow(byId)
  }

  const { data, error } = await supabase
    .from('games')
    .select(GAME_SELECT)
    .eq('slug', idOrSlug)
    .maybeSingle<RawGameRow>()

  if (error) throw error

  return data ? rawGameRowToGameRow(data) : null
}

export async function ensureDefaultGames() {
  const existing = await listAdminGames()
  if (existing.length > 0) return existing

  const supabase = createAdminClient()
  const genres = await ensureDefaultGenres()
  const genreByName = new Map(genres.map((genre) => [normalizeGameGenre(genre.name), genre]))
  const fallbackGenre = genres[0]

  if (!fallbackGenre) throw new Error('No game genres are available.')

  const { data, error } = await supabase
    .from('games')
    .insert(
      supportedGames.map((game) => ({
        name: game.name,
        slug: game.slug,
        image: '',
        genre_id: genreByName.get(normalizeGameGenre(game.genre))?.id ?? fallbackGenre.id,
        platforms: [game.platform],
        description: game.description,
        status: 'active' satisfies GameStatus,
      }))
    )
    .select(GAME_SELECT)
    .returns<RawGameRow[]>()

  if (error) throw error

  return (data ?? []).map(rawGameRowToGameRow)
}
