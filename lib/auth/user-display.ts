import type { User } from '@supabase/supabase-js'

export function getUserDisplayName(user: Pick<User, 'email' | 'user_metadata'>) {
  const metadataName =
    user.user_metadata.username ||
    user.user_metadata.full_name ||
    user.user_metadata.name ||
    user.user_metadata.preferred_username

  if (typeof metadataName === 'string' && metadataName.trim()) {
    return metadataName.trim()
  }

  return user.email?.split('@')[0] || 'Moon Strike Player'
}

export function getUserInitials(displayName: string, email?: string) {
  const source = displayName || email || 'MS'
  const parts = source
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
}

export function formatMemberSince(date?: string) {
  if (!date) return 'Unknown'

  return new Intl.DateTimeFormat('en', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}
