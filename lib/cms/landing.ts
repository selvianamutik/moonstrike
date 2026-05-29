import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from '@/lib/supabase/env'

export type LandingHeroData = {
  label: string
  headline: string
  subtext: string
  ctaText: string
  ctaHref: string
  badgeVariant: 'new' | 'featured' | 'hot'
  imageUrl: string
  thumbnailUrl: string
  storagePath: string
  thumbnailPath: string
}

export type LandingBenefitItem = {
  icon: string
  title: string
  detail: string
}

export type LandingBenefitsData = {
  title: string
  accent: string
  imageUrl: string
  thumbnailUrl: string
  storagePath: string
  thumbnailPath: string
  imageAlt: string
  items: LandingBenefitItem[]
}

export type ContentBlockRow = {
  id: string
  name: string
  type: 'hero' | 'stats_bar' | 'benefits_section' | 'steps_section'
  status: 'active' | 'scheduled' | 'draft'
  data: unknown
  thumbnail: string | null
  scheduled_at: string | null
  modified_at: string
  created_by: string
}

export const CONTENT_BLOCK_SLUGS = {
  hero: 'landing-hero',
  benefits_section: 'why-choose-us',
} as const

export const DEFAULT_LANDING_HERO: LandingHeroData = {
  label: 'Featured Recommended',
  headline: 'Void Descent Seasonal Event',
  subtext:
    'Master new challenge rifts and claim exclusive cosmic armor sets before the season ends.',
  ctaText: 'Learn More',
  ctaHref: '/games',
  badgeVariant: 'new',
  imageUrl: '',
  thumbnailUrl: '',
  storagePath: '',
  thumbnailPath: '',
}

export const DEFAULT_LANDING_BENEFITS: LandingBenefitsData = {
  title: 'Why Choose Us',
  accent: 'Choose Us',
  imageUrl: '',
  thumbnailUrl: '',
  storagePath: '',
  thumbnailPath: '',
  imageAlt: 'Moon Strike benefits preview',
  items: [
    {
      icon: 'MS',
      title: 'Verified Pro Players',
      detail:
        'Every booster is vetted for account safety, game knowledge, and consistent delivery.',
    },
    {
      icon: 'PV',
      title: 'Progress Visibility',
      detail:
        'Customers get clear updates during the run, with support ready for order questions.',
    },
    {
      icon: 'SC',
      title: 'Secure Checkout',
      detail:
        'Payment flow stays separated from frontend UI and routes through supported providers.',
    },
  ],
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : fallback
}

function normalizeBenefitItems(value: unknown) {
  const items = Array.isArray(value) ? value : []
  const normalized = items.slice(0, 3).map((item, index) => {
    const record = item && typeof item === 'object' ? item as Record<string, unknown> : {}
    const fallback = DEFAULT_LANDING_BENEFITS.items[index]

    return {
      icon: stringValue(record.icon, fallback.icon),
      title: stringValue(record.title, fallback.title),
      detail: stringValue(record.detail, fallback.detail),
    } satisfies LandingBenefitItem
  })

  return DEFAULT_LANDING_BENEFITS.items.map(
    (fallback, index) => normalized[index] ?? fallback
  )
}

export function normalizeLandingHeroData(data: unknown): LandingHeroData {
  const value = data && typeof data === 'object' ? data : {}
  const record = value as Record<string, unknown>
  const badgeVariant = record.badgeVariant

  return {
    label: stringValue(record.label, DEFAULT_LANDING_HERO.label),
    headline: stringValue(record.headline, DEFAULT_LANDING_HERO.headline),
    subtext: stringValue(record.subtext, DEFAULT_LANDING_HERO.subtext),
    ctaText: stringValue(record.ctaText, DEFAULT_LANDING_HERO.ctaText),
    ctaHref: stringValue(record.ctaHref, DEFAULT_LANDING_HERO.ctaHref),
    imageUrl: stringValue(record.imageUrl, DEFAULT_LANDING_HERO.imageUrl),
    thumbnailUrl: stringValue(
      record.thumbnailUrl,
      DEFAULT_LANDING_HERO.thumbnailUrl
    ),
    storagePath: stringValue(
      record.storagePath,
      DEFAULT_LANDING_HERO.storagePath
    ),
    thumbnailPath: stringValue(
      record.thumbnailPath,
      DEFAULT_LANDING_HERO.thumbnailPath
    ),
    badgeVariant:
      badgeVariant === 'featured' || badgeVariant === 'hot'
        ? badgeVariant
        : DEFAULT_LANDING_HERO.badgeVariant,
  }
}

export function normalizeLandingBenefitsData(data: unknown): LandingBenefitsData {
  const value = data && typeof data === 'object' ? data : {}
  const record = value as Record<string, unknown>

  return {
    title: stringValue(record.title, DEFAULT_LANDING_BENEFITS.title),
    accent: stringValue(record.accent, DEFAULT_LANDING_BENEFITS.accent),
    imageUrl: stringValue(record.imageUrl, DEFAULT_LANDING_BENEFITS.imageUrl),
    thumbnailUrl: stringValue(
      record.thumbnailUrl,
      DEFAULT_LANDING_BENEFITS.thumbnailUrl
    ),
    storagePath: stringValue(
      record.storagePath,
      DEFAULT_LANDING_BENEFITS.storagePath
    ),
    thumbnailPath: stringValue(
      record.thumbnailPath,
      DEFAULT_LANDING_BENEFITS.thumbnailPath
    ),
    imageAlt: stringValue(record.imageAlt, DEFAULT_LANDING_BENEFITS.imageAlt),
    items: normalizeBenefitItems(record.items),
  }
}

function createPublicClient() {
  return createClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function getActiveLandingHero() {
  const supabase = createPublicClient()

  const { data } = await supabase
    .from('content_blocks')
    .select('data')
    .eq('type', 'hero')
    .eq('status', 'active')
    .order('modified_at', { ascending: false })
    .limit(1)
    .maybeSingle<{ data: unknown }>()

  return normalizeLandingHeroData(data?.data)
}

export async function getActiveLandingBenefits() {
  const supabase = createPublicClient()

  const { data } = await supabase
    .from('content_blocks')
    .select('data')
    .eq('type', 'benefits_section')
    .eq('status', 'active')
    .order('modified_at', { ascending: false })
    .limit(1)
    .maybeSingle<{ data: unknown }>()

  return normalizeLandingBenefitsData(data?.data)
}

export async function getActiveLandingCms() {
  const [hero, benefits] = await Promise.all([
    getActiveLandingHero(),
    getActiveLandingBenefits(),
  ])

  return { hero, benefits }
}

export async function listAdminContentBlocks() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('content_blocks')
    .select(
      'id, name, type, status, data, thumbnail, scheduled_at, modified_at, created_by'
    )
    .order('modified_at', { ascending: false })
    .returns<ContentBlockRow[]>()

  if (error) throw error

  return data ?? []
}

export async function getAdminContentBlock(id: string) {
  const supabase = createAdminClient()
  const knownType = Object.entries(CONTENT_BLOCK_SLUGS).find(
    ([, slug]) => slug === id
  )?.[0]
  let query = supabase
    .from('content_blocks')
    .select(
      'id, name, type, status, data, thumbnail, scheduled_at, modified_at, created_by'
    )

  query = knownType ? query.eq('type', knownType) : query.eq('id', id)

  const { data, error } = await query
    .order('modified_at', { ascending: false })
    .limit(1)
    .maybeSingle<ContentBlockRow>()

  if (error) throw error

  return data
}

export async function ensureLandingHeroBlock(adminId: string) {
  const supabase = createAdminClient()
  const { data: existing, error: existingError } = await supabase
    .from('content_blocks')
    .select(
      'id, name, type, status, data, thumbnail, scheduled_at, modified_at, created_by'
    )
    .eq('type', 'hero')
    .order('modified_at', { ascending: false })
    .limit(1)
    .maybeSingle<ContentBlockRow>()

  if (existingError) throw existingError
  if (existing) return existing

  const { data, error } = await supabase
    .from('content_blocks')
    .insert({
      name: 'Landing Hero',
      type: 'hero',
      status: 'active',
      data: DEFAULT_LANDING_HERO,
      created_by: adminId,
    })
    .select(
      'id, name, type, status, data, thumbnail, scheduled_at, modified_at, created_by'
    )
    .single<ContentBlockRow>()

  if (error) throw error

  return data
}

export async function ensureLandingBenefitsBlock(adminId: string) {
  const supabase = createAdminClient()
  const { data: existing, error: existingError } = await supabase
    .from('content_blocks')
    .select(
      'id, name, type, status, data, thumbnail, scheduled_at, modified_at, created_by'
    )
    .eq('type', 'benefits_section')
    .order('modified_at', { ascending: false })
    .limit(1)
    .maybeSingle<ContentBlockRow>()

  if (existingError) throw existingError
  if (existing) return existing

  const { data, error } = await supabase
    .from('content_blocks')
    .insert({
      name: 'Why Choose Us',
      type: 'benefits_section',
      status: 'active',
      data: DEFAULT_LANDING_BENEFITS,
      created_by: adminId,
    })
    .select(
      'id, name, type, status, data, thumbnail, scheduled_at, modified_at, created_by'
    )
    .single<ContentBlockRow>()

  if (error) throw error

  return data
}
