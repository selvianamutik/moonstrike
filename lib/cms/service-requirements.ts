export type ServiceRequirement = {
  text: string
  serviceId?: string
  serviceTitle?: string
  serviceSlug?: string
  serviceCategorySlug?: string
  gameSlug?: string
}

type RawRequirement = ServiceRequirement | string

function isRequirementObject(value: unknown): value is ServiceRequirement {
  return Boolean(value && typeof value === 'object' && 'text' in value)
}

export function emptyServiceRequirement(): ServiceRequirement {
  return { text: '' }
}

export function parseServiceRequirement(value: unknown): ServiceRequirement | null {
  if (typeof value !== 'string') {
    if (!isRequirementObject(value)) return null

    const text = typeof value.text === 'string' ? value.text.trim() : ''
    if (!text) return null

    return {
      text,
      serviceId: typeof value.serviceId === 'string' ? value.serviceId.trim() || undefined : undefined,
      serviceTitle: typeof value.serviceTitle === 'string' ? value.serviceTitle.trim() || undefined : undefined,
      serviceSlug: typeof value.serviceSlug === 'string' ? value.serviceSlug.trim() || undefined : undefined,
      serviceCategorySlug: typeof value.serviceCategorySlug === 'string' ? value.serviceCategorySlug.trim() || undefined : undefined,
      gameSlug: typeof value.gameSlug === 'string' ? value.gameSlug.trim() || undefined : undefined,
    }
  }

  const trimmed = value.trim()
  if (!trimmed) return null

  if (!trimmed.startsWith('{')) return { text: trimmed }

  try {
    const parsed = JSON.parse(trimmed) as unknown
    return parseServiceRequirement(parsed) ?? { text: trimmed }
  } catch {
    return { text: trimmed }
  }
}

export function parseServiceRequirements(values: unknown): ServiceRequirement[] {
  if (!Array.isArray(values)) return []

  return values
    .map((value) => parseServiceRequirement(value))
    .filter((value): value is ServiceRequirement => Boolean(value))
}

export function serializeServiceRequirement(requirement: RawRequirement) {
  const parsed = parseServiceRequirement(requirement)
  if (!parsed) return null

  if (!parsed.serviceId && !parsed.serviceSlug && !parsed.gameSlug) {
    return parsed.text
  }

  return JSON.stringify(parsed)
}

export function serializeServiceRequirements(values: unknown) {
  if (!Array.isArray(values)) return []

  return values
    .map((value) => serializeServiceRequirement(value as RawRequirement))
    .filter((value): value is string => Boolean(value))
}
