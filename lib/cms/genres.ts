import { CANONICAL_GAME_GENRES } from '@/lib/admin-constants'
import { writeAuditLog } from '@/lib/admin/audit'
import type { AdminSession } from '@/lib/admin/session'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NextRequest } from 'next/server'

export type GenreRow = {
  id: string
  name: string
  slug: string
  created_at?: string
}

export function normalizeGameGenre(genre: string) {
  return genre.trim().replace(/\s+/g, ' ').toUpperCase()
}

export function slugifyGenre(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function listGenres() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('genres')
    .select('id, name, slug, created_at')
    .order('name', { ascending: true })
    .returns<GenreRow[]>()

  if (error) throw error

  return data ?? []
}

export async function ensureDefaultGenres() {
  const supabase = createAdminClient()
  const existing = await listGenres()

  if (existing.length > 0) return existing

  const { data, error } = await supabase
    .from('genres')
    .insert(
      CANONICAL_GAME_GENRES.map((genre) => ({
        name: normalizeGameGenre(genre),
        slug: slugifyGenre(genre),
      }))
    )
    .select('id, name, slug, created_at')
    .returns<GenreRow[]>()

  if (error) throw error

  return data ?? []
}

export async function createGenre({
  name,
  slug,
  request,
  admin,
}: {
  name: string
  slug?: string
  request: NextRequest
  admin: AdminSession
}) {
  const normalizedName = normalizeGameGenre(name)
  const normalizedSlug = slugifyGenre(slug || normalizedName)

  if (!normalizedName || !normalizedSlug) {
    return { error: 'Genre name is required.', status: 400 as const }
  }

  const existing = await listGenres()
  const duplicate = existing.find(
    (genre) => genre.name.toLowerCase() === normalizedName.toLowerCase()
  )

  if (duplicate) {
    return { error: 'This genre already exists.', status: 409 as const }
  }

  const duplicateSlug = existing.find(
    (genre) => genre.slug.toLowerCase() === normalizedSlug.toLowerCase()
  )

  if (duplicateSlug) {
    return { error: 'This genre slug already exists.', status: 409 as const }
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('genres')
    .insert({ name: normalizedName, slug: normalizedSlug })
    .select('id, name, slug, created_at')
    .single<GenreRow>()

  if (error) {
    if (error.code === '23505') {
      return { error: 'This genre or slug already exists.', status: 409 as const }
    }

    return { error: error.message, status: 500 as const }
  }

  await writeAuditLog({
    action: `Created genre: ${normalizedName}`,
    status: 'success',
    request,
    admin,
  })

  return { genre: data }
}

export async function deleteGenre({
  id,
  request,
  admin,
}: {
  id: string
  request: NextRequest
  admin: AdminSession
}) {
  const supabase = createAdminClient()
  const { data: genre, error: lookupError } = await supabase
    .from('genres')
    .select('id, name')
    .eq('id', id)
    .maybeSingle<{ id: string; name: string }>()

  if (lookupError) {
    return { error: lookupError.message, status: 500 as const }
  }

  if (!genre) {
    return { error: 'Genre not found.', status: 404 as const }
  }

  const { count, error: countError } = await supabase
    .from('games')
    .select('id', { count: 'exact', head: true })
    .eq('genre_id', id)

  if (countError) {
    return { error: countError.message, status: 500 as const }
  }

  if ((count ?? 0) > 0) {
    return {
      error: `Cannot delete - ${count} games use this genre.`,
      status: 409 as const,
    }
  }

  const { error } = await supabase.from('genres').delete().eq('id', id)

  if (error) {
    if (error.code === '23503') {
      return {
        error: 'Cannot delete - games use this genre.',
        status: 409 as const,
      }
    }

    return { error: error.message, status: 500 as const }
  }

  await writeAuditLog({
    action: `Deleted genre: ${genre.name}`,
    status: 'success',
    request,
    admin,
  })

  return { ok: true as const }
}
