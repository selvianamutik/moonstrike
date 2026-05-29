import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import {
  ADMIN_REMEMBER_SECONDS,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_SECONDS,
  signAdminToken,
  verifyAdminPassword,
} from '@/lib/admin/auth'
import { writeAuditLog } from '@/lib/admin/audit'
import { createAdminClient } from '@/lib/supabase/admin'

const WINDOW_MS = 15 * 60 * 1000
const MAX_IP_REQUESTS = 20
const MAX_EMAIL_REQUESTS = 5
const attempts = new Map<string, { count: number; resetAt: number }>()

type AdminUserRow = {
  id: string
  display_name: string
  email: string
  password_hash: string
  status: 'active' | 'suspended' | 'banned'
}

function getClientIp(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function incrementRateLimit(key: string, maxRequests: number) {
  const now = Date.now()
  const current = attempts.get(key)

  if (!current || current.resetAt <= now) {
    const resetAt = now + WINDOW_MS
    attempts.set(key, { count: 1, resetAt })
    return { limited: false, resetAt }
  }

  current.count += 1
  attempts.set(key, current)

  return { limited: current.count > maxRequests, resetAt: current.resetAt }
}

function clearRateLimit(key: string) {
  attempts.delete(key)
}

function rateLimitResponse(resetAt: number) {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))

  return NextResponse.json(
    { error: 'Too many admin login attempts. Try again in 15 minutes.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
      },
    }
  )
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const email =
    typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const remember = body?.remember === true

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required.' },
      { status: 400 }
    )
  }

  const clientIp = getClientIp(request)
  const ipKey = `admin-login:ip:${clientIp}`
  const emailKey = `admin-login:email:${clientIp}:${email}`
  const ipLimit = incrementRateLimit(ipKey, MAX_IP_REQUESTS)
  const emailLimit = incrementRateLimit(emailKey, MAX_EMAIL_REQUESTS)

  if (ipLimit.limited || emailLimit.limited) {
    await writeAuditLog({
      action: `Admin login rate limit blocked for ${email}`,
      status: 'blocked',
      request,
      actorLabel: email,
    })

    return rateLimitResponse(
      Math.max(ipLimit.resetAt, emailLimit.resetAt)
    )
  }

  const supabase = createAdminClient()
  const { data: admin, error } = await supabase
    .from('admin_users')
    .select('id, display_name, email, password_hash, status')
    .eq('email', email)
    .maybeSingle<AdminUserRow>()

  if (error || !admin || admin.status !== 'active') {
    await writeAuditLog({
      action: `Admin login failed for ${email}`,
      status: 'blocked',
      request,
      actorLabel: email,
    })

    return NextResponse.json(
      { error: 'Invalid admin credentials.' },
      { status: 401 }
    )
  }

  if (!verifyAdminPassword(password, admin.password_hash)) {
    await writeAuditLog({
      action: `Admin login failed for ${email}`,
      status: 'blocked',
      request,
      actorLabel: email,
    })

    return NextResponse.json(
      { error: 'Invalid admin credentials.' },
      { status: 401 }
    )
  }

  const maxAge = remember ? ADMIN_REMEMBER_SECONDS : ADMIN_SESSION_SECONDS
  let token: string

  try {
    token = signAdminToken(admin, maxAge)
  } catch {
    await writeAuditLog({
      action: 'Admin login failed because JWT_SECRET is missing or invalid',
      status: 'critical',
      request,
      actorLabel: email,
    })

    return NextResponse.json(
      { error: 'Admin authentication is not configured.' },
      { status: 500 }
    )
  }
  const cookieStore = await cookies()

  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  })

  await supabase
    .from('admin_users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', admin.id)

  clearRateLimit(emailKey)

  await writeAuditLog({
    action: 'Admin login successful',
    status: 'success',
    request,
    admin: {
      id: admin.id,
      email: admin.email,
      displayName: admin.display_name,
    },
  })

  return NextResponse.json({
    admin: {
      id: admin.id,
      email: admin.email,
      displayName: admin.display_name,
    },
  })
}
