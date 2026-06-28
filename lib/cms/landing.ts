import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from '@/lib/supabase/env'
import { heroBannerToHeroSlide, listActiveHeroBanners } from '@/lib/cms/hero-banners'

export type LandingHeroData = {
  label: string
  headline: string
  subtext: string
  ctaText: string
  ctaHref: string
  badgeVariant: 'new' | 'featured' | 'hot'
  badges?: string[]
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

export type LandingStepsData = {
  title: string
  accent: string
  subtitle: string
  items: LandingStepItem[]
}

export type LandingStepItem = {
  title: string
  description: string
}

export const DEFAULT_LANDING_STEPS: LandingStepsData = {
  title: 'Up and Running in',
  accent: '4 Simple Steps',
  subtitle: 'A short path from service choice to completed result.',
  items: [
    { title: 'Choose Your Service', description: 'Pick the boost, coaching, raid, or item service that matches your goal.' },
    { title: 'Configure Options', description: 'Select run size, delivery speed, and other service-specific options.' },
    { title: 'Track Progress', description: 'Follow order updates and use support chat for questions or extra instructions.' },
    { title: 'Enjoy the Result', description: 'Log back in after delivery and review the completed work.' },
  ],
}

export const CONTENT_BLOCK_SLUGS = {
  hero: 'landing-hero',
  benefits_section: 'why-choose-us',
  steps_section: 'how-it-works',
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
  const normalized = items.map((item, index) => {
    const record = item && typeof item === 'object' ? item as Record<string, unknown> : {}
    const fallback = DEFAULT_LANDING_BENEFITS.items[index]

    return {
      icon: stringValue(record.icon, fallback?.icon ?? 'MS'),
      title: stringValue(record.title, fallback?.title ?? `Benefit ${index + 1}`),
      detail: stringValue(record.detail, fallback?.detail ?? ''),
    } satisfies LandingBenefitItem
  })

  if (normalized.length === 0) {
    return [DEFAULT_LANDING_BENEFITS.items[0]!]
  }

  return normalized
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
    badges: Array.isArray(record.badges)
      ? record.badges.map((badge) => (typeof badge === 'string' ? badge.trim() : '')).filter(Boolean)
      : undefined,
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

export async function getActiveHeroSlides() {
  const heroBanners = await listActiveHeroBanners()

  if (heroBanners.length > 0) {
    return heroBanners.map(heroBannerToHeroSlide)
  }

  const supabase = createPublicClient()

  const { data } = await supabase
    .from('content_blocks')
    .select('data')
    .eq('type', 'hero')
    .eq('status', 'active')
    .order('modified_at', { ascending: false })
    .returns<{ data: unknown }[]>()

  if (!data || data.length === 0) {
    return [DEFAULT_LANDING_HERO]
  }

  return data.map((row) => normalizeLandingHeroData(row.data))
}

export async function getActiveLandingBenefits() {
  const supabase = createPublicClient()
  const now = new Date().toISOString()

  const { data } = await supabase
    .from('content_blocks')
    .select('data, status, scheduled_at')
    .eq('type', 'benefits_section')
    .in('status', ['active', 'scheduled'])
    .order('modified_at', { ascending: false })
    .returns<{ data: unknown; status?: string; scheduled_at?: string | null }[]>()

  const visible = (data ?? []).find((row) => row.status === 'active' || Boolean(row.scheduled_at && row.scheduled_at <= now))

  return normalizeLandingBenefitsData(visible?.data)
}

export function normalizeLandingStepsData(data: unknown): LandingStepsData {
  const value = data && typeof data === 'object' ? data : {}
  const record = value as Record<string, unknown>
  const rawItems = Array.isArray(record.items) ? record.items : []

  const items: LandingStepItem[] = rawItems.length > 0
    ? rawItems.map((item, index) => {
        const r = item && typeof item === 'object' ? item as Record<string, unknown> : {}
        const fallback = DEFAULT_LANDING_STEPS.items[index]
        return {
          title: stringValue(r.title, fallback?.title ?? `Step ${index + 1}`),
          description: stringValue(r.description, fallback?.description ?? ''),
        }
      })
    : DEFAULT_LANDING_STEPS.items

  return {
    title: stringValue(record.title, DEFAULT_LANDING_STEPS.title),
    accent: stringValue(record.accent, DEFAULT_LANDING_STEPS.accent),
    subtitle: stringValue(record.subtitle, DEFAULT_LANDING_STEPS.subtitle),
    items,
  }
}

export async function getActiveLandingSteps() {
  const supabase = createPublicClient()
  const now = new Date().toISOString()

  const { data } = await supabase
    .from('content_blocks')
    .select('data, status, scheduled_at')
    .eq('type', 'steps_section')
    .in('status', ['active', 'scheduled'])
    .order('modified_at', { ascending: false })
    .returns<{ data: unknown; status?: string; scheduled_at?: string | null }[]>()
    .limit(1)
    .maybeSingle()

  if (!data) return DEFAULT_LANDING_STEPS

  const isVisible = data.status === 'active' || Boolean(data.scheduled_at && data.scheduled_at <= now)
  return isVisible ? normalizeLandingStepsData(data.data) : DEFAULT_LANDING_STEPS
}

export async function ensureLandingStepsBlock(adminId: string) {
  const supabase = createAdminClient()
  const { data: existing, error: existingError } = await supabase
    .from('content_blocks')
    .select('id')
    .eq('type', 'steps_section')
    .limit(1)
    .maybeSingle<{ id: string }>()

  if (existingError) throw existingError
  if (existing) return existing

  const { data, error } = await supabase
    .from('content_blocks')
    .insert({
      name: 'How It Works',
      type: 'steps_section',
      status: 'active',
      data: DEFAULT_LANDING_STEPS,
      created_by: adminId,
    })
    .select('id')
    .single<{ id: string }>()

  if (error) throw error
  return data
}

export async function getActiveLandingCms() {
  const [benefits, steps] = await Promise.all([
    getActiveLandingBenefits(),
    getActiveLandingSteps(),
  ])

  return { benefits, steps }
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
