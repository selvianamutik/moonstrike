import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import {
  getSupabasePublishableKey,
  getSupabaseSecretKey,
  getSupabaseUrl,
} from '@/lib/supabase/env'

const WINDOW_MS = 15 * 60 * 1000
const MAX_REQUESTS = 3
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
      { error: 'Too many reset emails requested. Try again in 15 minutes.' },
      { status: 429 }
    )
  }

  const existingUser = await findUserByEmail(email)

  if (!existingUser) {
    return NextResponse.json(
      { error: 'No Moon Strike account exists for that email.' },
      { status: 404 }
    )
  }

  const providers = Array.isArray(existingUser.app_metadata.providers)
    ? existingUser.app_metadata.providers.filter(
        (provider): provider is string => typeof provider === 'string'
      )
    : []
  const hasPasswordLogin =
    providers.includes('email') ||
    existingUser.user_metadata?.has_email_password === true

  if (providers.includes('google') && !hasPasswordLogin) {
    return NextResponse.json(
      {
        error:
          'This account uses Google sign-in. Continue with Google, then add an email password from Profile Edit if you want password login.',
        providers,
      },
      { status: 409 }
    )
  }

  const supabase = createClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const redirectTo = new URL('/reset-password', request.nextUrl.origin)

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo.toString(),
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({
    message: 'Reset link sent.',
    expiresHint:
      'Reset links expire based on your Supabase Auth email OTP expiry setting.',
  })
}
