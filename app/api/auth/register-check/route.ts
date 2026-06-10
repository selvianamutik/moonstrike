import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseSecretKey, getSupabaseUrl } from '@/lib/supabase/env'

const WINDOW_MS = 15 * 60 * 1000
const MAX_REQUESTS = 5
const attempts = new Map<string, { count: number; resetAt: number }>()

function getClientIp(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function isRateLimited(key: string) {
  const now = Date.now()
  const current = attempts.get(key)

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }

  current.count += 1
  attempts.set(key, current)
  return current.count > MAX_REQUESTS
}

async function findUserByEmail(email: string) {
  const admin = createClient(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  let page = 1
  const perPage = 1000

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })

    if (error) throw error

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === email
    )
    if (user) return user
    if (data.users.length < perPage) return null

    page += 1
  }

  return null
}

function getProviderMessage(providers: string[]) {
  if (providers.includes('google')) {
    return 'This email is already registered with Google. Use Continue with Google to sign in.'
  }

  if (providers.includes('email')) {
    return 'This email is already registered. Open the Login tab and sign in with this email. If the email is not verified yet, click the Resend Verification button shown on the login form.'
  }

  return 'This email is already registered. Open the Login tab and use the original sign-in method for this account.'
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const email =
    typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }

  const rateKey = `${getClientIp(request)}:${email}`
  if (isRateLimited(rateKey)) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Try again in 15 minutes.' },
      { status: 429 }
    )
  }

  const existingUser = await findUserByEmail(email)

  if (existingUser) {
    const providers = Array.isArray(existingUser.app_metadata.providers)
      ? existingUser.app_metadata.providers.filter(
          (provider): provider is string => typeof provider === 'string'
        )
      : []

    return NextResponse.json(
      {
        error: getProviderMessage(providers),
        providers,
      },
      { status: 409 }
    )
  }

  return NextResponse.json({ ok: true })
}
