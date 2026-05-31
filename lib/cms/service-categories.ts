import { writeAuditLog } from '@/lib/admin/audit'
import type { AdminSession } from '@/lib/admin/session'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NextRequest } from 'next/server'

export type ServiceCategoryRow = {
  id: string
  game_id: string
  name: string
  slug: string
  sort_order: number
  created_at?: string
  game_name?: string
}

type RawServiceCategoryRow = Omit<ServiceCategoryRow, 'game_name'> & {
  games?: { name: string } | { name: string }[] | null
}

export function slugifyServiceCategory(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function rawCategoryToRow(row: RawServiceCategoryRow): ServiceCategoryRow {
  const game = Array.isArray(row.games) ? row.games[0] : row.games

  return {
    id: row.id,
    game_id: row.game_id,
    name: row.name,
    slug: row.slug,
    sort_order: row.sort_order,
    created_at: row.created_at,
    game_name: game?.name,
  }
}

export async function listServiceCategories() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('service_categories')
    .select('id, game_id, name, slug, sort_order, created_at, games(name)')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
    .returns<RawServiceCategoryRow[]>()

  if (error) throw error

  return (data ?? []).map(rawCategoryToRow)
}

export async function createServiceCategory({
  gameId,
  name,
  slug,
  sortOrder,
  request,
  admin,
}: {
  gameId: string
  name: string
  slug?: string
  sortOrder?: number
  request: NextRequest
  admin: AdminSession
}) {
  const trimmedName = name.trim()
  const normalizedSlug = slugifyServiceCategory(slug || trimmedName)

  if (!gameId || !trimmedName || !normalizedSlug) {
    return { error: 'Game, category name, and slug are required.', status: 400 as const }
  }

  if (normalizedSlug === 'hot-offers') {
    return { error: 'hot-offers is reserved.', status: 400 as const }
  }

  const supabase = createAdminClient()
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('id, name')
    .eq('id', gameId)
    .maybeSingle<{ id: string; name: string }>()

  if (gameError) return { error: gameError.message, status: 500 as const }
  if (!game) return { error: 'Game not found.', status: 404 as const }

  const { data: existing, error: lookupError } = await supabase
    .from('service_categories')
    .select('id')
    .eq('game_id', gameId)
    .eq('slug', normalizedSlug)
    .maybeSingle<{ id: string }>()

  if (lookupError) return { error: lookupError.message, status: 500 as const }

  if (existing) {
    return {
      error: `A category with this slug already exists for ${game.name}.`,
      status: 409 as const,
    }
  }

  const { data, error } = await supabase
    .from('service_categories')
    .insert({
      game_id: gameId,
      name: trimmedName,
      slug: normalizedSlug,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    })
    .select('id, game_id, name, slug, sort_order, created_at, games(name)')
    .single<RawServiceCategoryRow>()

  if (error) {
    if (error.code === '23505') {
      return {
        error: `A category with this slug already exists for ${game.name}.`,
        status: 409 as const,
      }
    }

    return { error: error.message, status: 500 as const }
  }

  await writeAuditLog({
    action: `Created service category: ${trimmedName}`,
    status: 'success',
    request,
    admin,
  })

  return { category: rawCategoryToRow(data) }
}

export async function updateServiceCategory({
  id,
  gameId,
  name,
  slug,
  sortOrder,
  request,
  admin,
}: {
  id: string
  gameId: string
  name: string
  slug?: string
  sortOrder?: number
  request: NextRequest
  admin: AdminSession
}) {
  const trimmedName = name.trim()
  const normalizedSlug = slugifyServiceCategory(slug || trimmedName)

  if (!id || !gameId || !trimmedName || !normalizedSlug) {
    return { error: 'Game, category name, and slug are required.', status: 400 as const }
  }

  if (normalizedSlug === 'hot-offers') {
    return { error: 'hot-offers is reserved.', status: 400 as const }
  }

  const supabase = createAdminClient()
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('id, name')
    .eq('id', gameId)
    .maybeSingle<{ id: string; name: string }>()

  if (gameError) return { error: gameError.message, status: 500 as const }
  if (!game) return { error: 'Game not found.', status: 404 as const }

  const { data: duplicate, error: lookupError } = await supabase
    .from('service_categories')
    .select('id')
    .eq('game_id', gameId)
    .eq('slug', normalizedSlug)
    .neq('id', id)
    .maybeSingle<{ id: string }>()

  if (lookupError) return { error: lookupError.message, status: 500 as const }

  if (duplicate) {
    return {
      error: `A category with this slug already exists for ${game.name}.`,
      status: 409 as const,
    }
  }

  const { data, error } = await supabase
    .from('service_categories')
    .update({
      game_id: gameId,
      name: trimmedName,
      slug: normalizedSlug,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    })
    .eq('id', id)
    .select('id, game_id, name, slug, sort_order, created_at, games(name)')
    .single<RawServiceCategoryRow>()

  if (error) {
    if (error.code === '23505') {
      return {
        error: `A category with this slug already exists for ${game.name}.`,
        status: 409 as const,
      }
    }

    return { error: error.message, status: 500 as const }
  }

  await writeAuditLog({
    action: `Updated service category: ${trimmedName}`,
    status: 'success',
    request,
    admin,
  })

  return { category: rawCategoryToRow(data) }
}

export async function deleteServiceCategory({
  id,
  request,
  admin,
}: {
  id: string
  request: NextRequest
  admin: AdminSession
}) {
  const supabase = createAdminClient()
  const { data: category, error: lookupError } = await supabase
    .from('service_categories')
    .select('id, name')
    .eq('id', id)
    .maybeSingle<{ id: string; name: string }>()

  if (lookupError) return { error: lookupError.message, status: 500 as const }
  if (!category) return { error: 'Service category not found.', status: 404 as const }

  const { error } = await supabase.from('service_categories').delete().eq('id', id)

  if (error) return { error: error.message, status: 500 as const }

  await writeAuditLog({
    action: `Deleted service category: ${category.name}`,
    status: 'success',
    request,
    admin,
  })

  return { ok: true as const }
}
