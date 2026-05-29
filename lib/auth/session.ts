import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function getLoginUrl(next: string, unverified = false) {
  const params = new URLSearchParams({ next })
  if (unverified) params.set('unverified', '1')
  return `/login?${params.toString()}`
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

export async function requireUser(next: string) {
  const user = await getCurrentUser()

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

  return user
}
