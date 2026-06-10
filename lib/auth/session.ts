import { redirect } from 'next/navigation'
import { getUserBanState } from '@/lib/auth/ban'
import { authProviders, hasEmailPassword } from '@/lib/auth/providers'
import { createClient } from '@/lib/supabase/server'

function getLoginUrl(next: string, unverified = false) {
  const params = new URLSearchParams({ next })
  if (unverified) params.set('unverified', '1')
  return `/login?${params.toString()}`
}

function getBannedLoginUrl(next: string) {
  const params = new URLSearchParams({ next, banned: '1' })
  return `/login?${params.toString()}`
}

function getCompleteRegistrationUrl(next: string) {
  const params = new URLSearchParams({ next })
  return `/register/complete?${params.toString()}`
}

async function getCurrentUserState() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, banned: false }
  }

  const banState = await getUserBanState(user.id)

  if (banState.banned) {
    await supabase.auth.signOut()
    return { user: null, banned: true }
  }

  return { user, banned: false }
}

export async function getCurrentUser() {
  const { user } = await getCurrentUserState()
  return user
}

export async function requireUser(next: string) {
  const { user, banned } = await getCurrentUserState()

  if (banned) {
    redirect(getBannedLoginUrl(next))
  }

  if (!user) {
    redirect(getLoginUrl(next))
  }

  return user
}

export async function requireVerifiedUser(next: string) {
  const user = await requireUser(next)

  if (!user.email_confirmed_at) {
    redirect(getLoginUrl(next, true))
  }

  if (authProviders(user).includes('google') && !hasEmailPassword(user)) {
    redirect(getCompleteRegistrationUrl(next))
  }

  return user
}
