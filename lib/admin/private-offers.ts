import { writeAuditLog } from '@/lib/admin/audit'
import type { AdminSession } from '@/lib/admin/session'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NextRequest } from 'next/server'

export type PrivateOfferRow = {
  id: string
  game_id: string
  quantity: number
  platform: string
  category: 'boosting' | 'coaching' | 'playmate'
  price_usd: number
  price_eur: number
  discount_percent: number
  title: string
  additional_info: string
  slug: string
  status: 'active' | 'archived'
  created_by: string
  created_at: string
  updated_at: string
  game_name?: string
}

type RawPrivateOfferRow = Omit<PrivateOfferRow, 'game_name'> & {
  games?: { name: string } | { name: string }[] | null
}

function rawToRow(row: RawPrivateOfferRow): PrivateOfferRow {
  const game = Array.isArray(row.games) ? row.games[0] : row.games
  return {
    ...row,
    game_name: game?.name,
  }
}

export async function listPrivateOffers() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('private_offers')
    .select('*, games(name)')
    .order('created_at', { ascending: false })
    .returns<RawPrivateOfferRow[]>()

  if (error) throw error
  return (data ?? []).map(rawToRow)
}

export async function getPrivateOffer(id: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('private_offers')
    .select('*, games(name)')
    .eq('id', id)
    .maybeSingle<RawPrivateOfferRow>()

  if (error) throw error
  return data ? rawToRow(data) : null
}

export async function getPrivateOfferBySlug(slug: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('private_offers')
    .select('*, games(name)')
    .eq('slug', slug)
    .maybeSingle<RawPrivateOfferRow>()

  if (error) throw error
  return data ? rawToRow(data) : null
}

export async function createPrivateOffer({
  gameId,
  quantity,
  platform,
  category,
  priceUsd,
  priceEur,
  discountPercent,
  title,
  additionalInfo,
  slug,
  request,
  admin,
}: {
  gameId: string
  quantity: number
  platform: string
  category: string
  priceUsd: number
  priceEur: number
  discountPercent: number
  title: string
  additionalInfo: string
  slug: string
  request: NextRequest
  admin: AdminSession
}) {
  const supabase = createAdminClient()

  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('id, name')
    .eq('id', gameId)
    .maybeSingle<{ id: string; name: string }>()

  if (gameError) return { error: gameError.message, status: 500 as const }
  if (!game) return { error: 'Game not found.', status: 404 as const }

  const { data: existing } = await supabase
    .from('private_offers')
    .select('id')
    .eq('slug', slug)
    .maybeSingle<{ id: string }>()

  if (existing) {
    return { error: 'A private offer with this slug already exists.', status: 409 as const }
  }

  const { data, error } = await supabase
    .from('private_offers')
    .insert({
      game_id: gameId,
      quantity,
      platform,
      category,
      price_usd: priceUsd,
      price_eur: priceEur,
      discount_percent: discountPercent,
      title,
      additional_info: additionalInfo,
      slug,
      created_by: admin.id,
    })
    .select('*, games(name)')
    .single<RawPrivateOfferRow>()

  if (error) return { error: error.message, status: 500 as const }

  await writeAuditLog({
    action: `Created private offer: ${title}`,
    status: 'success',
    request,
    admin,
  })

  return { offer: rawToRow(data) }
}

export async function updatePrivateOffer({
  id,
  gameId,
  quantity,
  platform,
  category,
  priceUsd,
  priceEur,
  discountPercent,
  title,
  additionalInfo,
  slug,
  request,
  admin,
}: {
  id: string
  gameId: string
  quantity: number
  platform: string
  category: string
  priceUsd: number
  priceEur: number
  discountPercent: number
  title: string
  additionalInfo: string
  slug: string
  request: NextRequest
  admin: AdminSession
}) {
  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('private_offers')
    .select('id')
    .eq('slug', slug)
    .neq('id', id)
    .maybeSingle<{ id: string }>()

  if (existing) {
    return { error: 'A private offer with this slug already exists.', status: 409 as const }
  }

  const { data, error } = await supabase
    .from('private_offers')
    .update({
      game_id: gameId,
      quantity,
      platform,
      category,
      price_usd: priceUsd,
      price_eur: priceEur,
      discount_percent: discountPercent,
      title,
      additional_info: additionalInfo,
      slug,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, games(name)')
    .single<RawPrivateOfferRow>()

  if (error) return { error: error.message, status: 500 as const }

  await writeAuditLog({
    action: `Updated private offer: ${title}`,
    status: 'success',
    request,
    admin,
  })

  return { offer: rawToRow(data) }
}

export async function deletePrivateOffer({
  id,
  request,
  admin,
}: {
  id: string
  request: NextRequest
  admin: AdminSession
}) {
  const supabase = createAdminClient()

  const { data: offer, error: lookupError } = await supabase
    .from('private_offers')
    .select('id, title')
    .eq('id', id)
    .maybeSingle<{ id: string; title: string }>()

  if (lookupError) return { error: lookupError.message, status: 500 as const }
  if (!offer) return { error: 'Private offer not found.', status: 404 as const }

  const { error } = await supabase.from('private_offers').delete().eq('id', id)

  if (error) return { error: error.message, status: 500 as const }

  await writeAuditLog({
    action: `Deleted private offer: ${offer.title}`,
    status: 'success',
    request,
    admin,
  })

  return { ok: true as const }
}
