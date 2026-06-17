import { NextResponse, type NextRequest } from 'next/server'
import { writeAuditLog } from '@/lib/admin/audit'
import { getAdminSession } from '@/lib/admin/session'
import { serializeServiceRequirements } from '@/lib/cms/service-requirements'
import { slugifyService } from '@/lib/cms/services'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const STATUSES = new Set(['active', 'draft', 'archived'])
const OPTION_TYPES = new Set([
  'dropdown',
  'radio',
  'checkbox_group',
  'range',
  'number_stepper',
  'quantity',
  'toggle',
  'text',
  'textarea',
])
const CHOICE_OPTION_TYPES = new Set(['dropdown', 'radio', 'checkbox_group'])
const UNIT_OPTION_TYPES = new Set(['range', 'number_stepper'])

function parseNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

function sanitizeOptionsSchema(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .map((option) => {
      const label = typeof option?.label === 'string' ? option.label.trim() : ''
      const type = typeof option?.type === 'string' && OPTION_TYPES.has(option.type) ? option.type : 'dropdown'

      if (!label) return null

      if (UNIT_OPTION_TYPES.has(type)) {
        const min = parseNumber(option?.min) || 1
        const rawMax = parseNumber(option?.max)

        return {
          label,
          type,
          required: option?.required !== false,
          min,
          max: rawMax > 0 ? Math.max(rawMax, min) : undefined,
          pricePerUnitUSD: parseNumber(option?.pricePerUnitUSD),
          pricePerUnitEUR: parseNumber(option?.pricePerUnitEUR),
        }
      }

      if (type === 'quantity') {
        const min = Math.max(parseNumber(option?.min) || 1, 1)
        const rawMax = parseNumber(option?.max)

        return {
          label,
          type,
          required: true,
          min,
          max: rawMax > 0 ? Math.max(rawMax, min) : 99,
        }
      }

      if (type === 'toggle') {
        return {
          label,
          type,
          required: option?.required !== false,
          enabledLabel: typeof option?.enabledLabel === 'string' && option.enabledLabel.trim() ? option.enabledLabel.trim() : 'Yes',
          disabledLabel: typeof option?.disabledLabel === 'string' && option.disabledLabel.trim() ? option.disabledLabel.trim() : 'No',
          priceUSD: parseNumber(option?.priceUSD),
          priceEUR: parseNumber(option?.priceEUR),
        }
      }

      if (type === 'text' || type === 'textarea') {
        return {
          label,
          type,
          required: option?.required !== false,
          placeholder: typeof option?.placeholder === 'string' ? option.placeholder.trim() : '',
        }
      }

      const choices = Array.isArray(option?.options)
        ? option.options
            .map((choice: unknown) => ({
              label: typeof (choice as { label?: unknown })?.label === 'string' ? (choice as { label: string }).label.trim() : '',
              priceUSD: parseNumber((choice as { priceUSD?: unknown })?.priceUSD),
              priceEUR: parseNumber((choice as { priceEUR?: unknown })?.priceEUR),
            }))
            .filter((choice: { label: string }) => choice.label)
        : []

      if (!CHOICE_OPTION_TYPES.has(type) || choices.length === 0) return null

      return {
        label,
        type,
        required: option?.required !== false,
        options: choices,
      }
    })
    .filter(Boolean)
}

function parsePayload(body: any) {
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const slug = slugifyService(typeof body?.slug === 'string' ? body.slug : title)
  const gameId = typeof body?.gameId === 'string' ? body.gameId.trim() : ''
  const categoryId =
    typeof body?.serviceCategoryId === 'string' && body.serviceCategoryId.trim()
      ? body.serviceCategoryId.trim()
      : null
  const status =
    typeof body?.status === 'string' && STATUSES.has(body.status)
      ? body.status
      : 'draft'
  return {
    title,
    slug,
    game_id: gameId,
    image: typeof body?.image === 'string' ? body.image.trim() : '',
    description: typeof body?.description === 'string' ? body.description.trim() : '',
    service_category_id: categoryId,
    status,
    is_hot_offer: body?.isHotOffer === true,
    badges: Array.isArray(body?.badges)
      ? body.badges
          .filter((value: unknown) => typeof value === 'string' && value.trim())
          .map((value: string) => value.trim())
      : [],
    requirements: serializeServiceRequirements(body?.requirements),
    what_you_get: Array.isArray(body?.whatYouGet) ? body.whatYouGet : [],
    base_price_usd: Number(body?.basePriceUSD) || 0,
    base_price_eur: Number(body?.basePriceEUR) || 0,
    options_schema: sanitizeOptionsSchema(body?.optionsSchema),
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const payload = parsePayload(body)

  if (!payload.title || !payload.slug || !payload.game_id) {
    return NextResponse.json({ error: 'Title, slug, and game are required.' }, { status: 400 })
  }

  if (payload.status === 'active' && !payload.service_category_id) {
    return NextResponse.json({ error: 'Active services require a category.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('services')
    .insert(payload)
    .select('id')
    .single<{ id: string }>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await writeAuditLog({
    action: `Created service: ${payload.title}`,
    status: 'success',
    request,
    admin,
  })

  revalidatePath('/admin/services')
  revalidatePath('/')
  revalidatePath('/games')

  return NextResponse.json({ service: data })
}
