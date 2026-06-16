import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ServiceOption } from '@/lib/cms/services'

export type Currency = 'USD' | 'EUR'
export type SelectionValue = string | string[] | number | boolean

export const CART_COOKIE = 'ms_cart_session'
const CART_COOKIE_MAX_AGE = 60 * 60 * 1

export type CartServiceRow = {
  id: string
  title: string
  slug: string
  image: string
  description: string
  base_price_usd: number | string
  base_price_eur: number | string
  options_schema: unknown
  games: { name: string; slug: string } | { name: string; slug: string }[] | null
  service_categories: { name: string; slug: string } | { name: string; slug: string }[] | null
}

export type CartItemRow = {
  id: string
  cart_id: string
  service_id: string
  selected_options: Record<string, SelectionValue>
  selected_options_snapshot: Record<string, { value: SelectionValue; priceUSD: number; priceEUR: number }>
  price_usd: number | string
  price_eur: number | string
  added_at: string
  services: CartServiceRow | CartServiceRow[] | null
}

type CookieStore = Awaited<ReturnType<typeof cookies>>

function relationOne<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export function getCartService(row: CartItemRow) {
  return relationOne(row.services)
}

export function getServiceGame(service: CartServiceRow | null | undefined) {
  return relationOne(service?.games)
}

export function getServiceCategory(service: CartServiceRow | null | undefined) {
  return relationOne(service?.service_categories)
}

async function getCartSessionId() {
  const cookieStore = await cookies()
  const existing = cookieStore.get(CART_COOKIE)?.value
  const sessionId = existing || randomUUID()

  setCartSessionCookie(cookieStore, sessionId)

  return sessionId
}

function setCartSessionCookie(cookieStore: CookieStore, sessionId: string) {
  cookieStore.set(CART_COOKIE, sessionId, {
    httpOnly: true,
    maxAge: CART_COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}

export async function getOrCreateCartId() {
  const sessionId = await getCartSessionId()
  const supabase = createAdminClient()

  const { data, error } = await supabase.from('carts').select('id').eq('session_id', sessionId).maybeSingle()
  if (error) throw error
  if (data?.id) return data.id as string

  const { data: cart, error: insertError } = await supabase
    .from('carts')
    .insert({ user_id: null, session_id: sessionId })
    .select('id')
    .single()

  if (insertError) throw insertError
  return cart.id as string
}

export async function getCurrentCartId() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(CART_COOKIE)?.value
  if (!sessionId) return null

  const supabase = createAdminClient()
  const { data, error } = await supabase.from('carts').select('id').eq('session_id', sessionId).maybeSingle()
  if (error) throw error
  return (data?.id as string | undefined) ?? null
}

export async function refreshCurrentCartSession() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(CART_COOKIE)?.value
  if (!sessionId) return null

  setCartSessionCookie(cookieStore, sessionId)
  return sessionId
}

export async function touchCart(cartId: string) {
  const supabase = createAdminClient()
  const touchedAt = new Date().toISOString()
  const { error } = await supabase.from('carts').update({ updated_at: touchedAt }).eq('id', cartId)

  if (error) throw error

  await refreshCurrentCartSession()
  return touchedAt
}

export async function assertCartItemOwnership(itemId: string) {
  const cartId = await getCurrentCartId()
  if (!cartId) return null

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('cart_items')
    .select('id, cart_id')
    .eq('id', itemId)
    .eq('cart_id', cartId)
    .maybeSingle()

  if (error) throw error
  return data
}

function isMultiChoice(option: ServiceOption) {
  return option.type === 'multiple_choice' || option.type === 'checkbox_group'
}

function isChoice(option: ServiceOption) {
  return ['single_choice', 'multiple_choice', 'dropdown', 'radio', 'checkbox_group'].includes(option.type)
}

function isUnitQuantity(option: ServiceOption) {
  return option.type === 'scalar' || option.type === 'range' || option.type === 'number_stepper'
}

function isQuantityOption(option: ServiceOption) {
  return option.type === 'quantity'
}

function defaultSelection(option: ServiceOption): SelectionValue {
  if (isMultiChoice(option)) return []
  if (isUnitQuantity(option) || isQuantityOption(option)) return option.min ?? 1
  if (option.type === 'toggle') return false
  if (option.type === 'text' || option.type === 'textarea') return ''
  return option.options?.[0]?.label ?? ''
}

function optionPrices(option: ServiceOption, value: SelectionValue) {
  if (isQuantityOption(option)) return { priceUSD: 0, priceEUR: 0 }

  if (isUnitQuantity(option)) {
    const count = Number(value) || 0
    return {
      priceUSD: count * (option.pricePerUnitUSD ?? 0),
      priceEUR: count * (option.pricePerUnitEUR ?? 0),
    }
  }

  if (isMultiChoice(option)) {
    const selected = Array.isArray(value) ? value : []
    return (option.options ?? [])
      .filter((item) => selected.includes(item.label))
      .reduce(
        (total, item) => ({
          priceUSD: total.priceUSD + item.priceUSD,
          priceEUR: total.priceEUR + item.priceEUR,
        }),
        { priceUSD: 0, priceEUR: 0 },
      )
  }

  if (option.type === 'toggle') {
    return value === true
      ? { priceUSD: option.priceUSD ?? 0, priceEUR: option.priceEUR ?? 0 }
      : { priceUSD: 0, priceEUR: 0 }
  }

  if (!isChoice(option)) return { priceUSD: 0, priceEUR: 0 }

  const selected = option.options?.find((item) => item.label === value)
  return selected ? { priceUSD: selected.priceUSD, priceEUR: selected.priceEUR } : { priceUSD: 0, priceEUR: 0 }
}

export function calculateCartSnapshot(
  service: { base_price_usd: number | string; base_price_eur: number | string; options_schema: unknown },
  selectedOptions: Record<string, SelectionValue>,
) {
  const options = Array.isArray(service.options_schema) ? (service.options_schema as ServiceOption[]) : []
  const snapshot: Record<string, { value: SelectionValue; priceUSD: number; priceEUR: number }> = {}
  let optionsUSD = 0
  let optionsEUR = 0
  let quantity = 1

  for (const option of options) {
    const value = selectedOptions[option.label] ?? defaultSelection(option)
    const prices = optionPrices(option, value)

    snapshot[option.label] = { value, ...prices }
    optionsUSD += prices.priceUSD
    optionsEUR += prices.priceEUR

    if (isQuantityOption(option)) {
      quantity = Math.max(1, Number(value) || 1)
    }
  }

  const unitUSD = Number(service.base_price_usd) + optionsUSD
  const unitEUR = Number(service.base_price_eur) + optionsEUR

  return {
    selectedOptions: Object.fromEntries(options.map((option) => [option.label, selectedOptions[option.label] ?? defaultSelection(option)])),
    snapshot,
    priceUSD: unitUSD * quantity,
    priceEUR: unitEUR * quantity,
  }
}
