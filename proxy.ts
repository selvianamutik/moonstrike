import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabasePublishableKey, getSupabaseUrl } from './lib/supabase/env'
import { createAdminClient } from './lib/supabase/admin'

const PROTECTED_ROUTES = ['/profile', '/checkout']
const ADMIN_SESSION_COOKIE = 'ms_admin_session'

function isBanActive(bannedUntil: string | null | undefined) {
  return Boolean(bannedUntil && new Date(bannedUntil).getTime() > Date.now())
}

function base64UrlToBytes(value: string) {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

function base64UrlToString(value: string) {
  return new TextDecoder().decode(base64UrlToBytes(value))
}

function bytesToBase64Url(bytes: ArrayBuffer) {
  let binary = ''
  const view = new Uint8Array(bytes)

  for (let index = 0; index < view.length; index += 1) {
    binary += String.fromCharCode(view[index])
  }

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

async function verifyAdminToken(token?: string) {
  if (!token) return null

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret || jwtSecret.length < 32) return null

  const [header, payload, signature] = token.split('.')
  if (!header || !payload || !signature) return null

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(jwtSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const expected = bytesToBase64Url(
    await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(`${header}.${payload}`)
    )
  )

  if (expected !== signature) return null

  try {
    const parsed = JSON.parse(base64UrlToString(payload)) as {
      role?: string
      exp?: number
      sub?: string
      email?: string
      name?: string
    }

    const isValid = (
      parsed.role &&
      ['admin', 'super_admin', 'support'].includes(parsed.role) &&
      typeof parsed.exp === 'number' &&
      parsed.exp > Math.floor(Date.now() / 1000)
    )

    return isValid ? parsed : null
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const { pathname } = request.nextUrl
  const returnTo = `${pathname}${request.nextUrl.search}`

  // OAuth fallback: when the Supabase Auth redirect URL list is missing
  // /auth/callback, Supabase redirects back to the Site URL (e.g. /?code=...).
  // Forward any auth payload (OAuth code, email token_hash, or error) that
  // lands on another page to the callback route.
  if (
    pathname !== '/auth/callback' &&
    !pathname.startsWith('/api/') &&
    (request.nextUrl.searchParams.has('code') ||
      request.nextUrl.searchParams.has('token_hash') ||
      request.nextUrl.searchParams.has('error'))
  ) {
    const callbackUrl = request.nextUrl.clone()
    callbackUrl.pathname = '/auth/callback'
    return NextResponse.redirect(callbackUrl)
  }

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login'
    const adminSession = await verifyAdminToken(
      request.cookies.get(ADMIN_SESSION_COOKIE)?.value
    )

    if (!isLoginPage && !adminSession) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/admin/login'
      loginUrl.searchParams.set('next', returnTo)
      return NextResponse.redirect(loginUrl)
    }

    if (isLoginPage && adminSession) {
      const dashboardUrl = request.nextUrl.clone()
      dashboardUrl.pathname = '/admin/dashboard'
      dashboardUrl.search = ''
      return NextResponse.redirect(dashboardUrl)
    }

    if (adminSession && adminSession.role !== 'super_admin') {
      let requiredPerm = ''
      if (pathname.startsWith('/admin/users')) requiredPerm = 'users'
      else if (pathname.startsWith('/admin/games')) requiredPerm = 'games'
      else if (pathname.startsWith('/admin/services')) requiredPerm = 'services'
      else if (pathname.startsWith('/admin/private-offers')) requiredPerm = 'services'
      else if (pathname.startsWith('/admin/orders')) requiredPerm = 'orders'
      else if (pathname.startsWith('/admin/transactions')) requiredPerm = 'transactions'
      else if (pathname.startsWith('/admin/content')) requiredPerm = 'content'
      else if (pathname.startsWith('/admin/pages')) requiredPerm = 'content'
      else if (pathname.startsWith('/admin/messages')) requiredPerm = 'messages'
      else if (pathname.startsWith('/admin/logs')) requiredPerm = 'logs'
      else if (pathname.startsWith('/admin/settings')) requiredPerm = 'settings'
      else if (pathname.startsWith('/admin/admins')) requiredPerm = 'admins'

      if (requiredPerm) {
        const adminSupabase = createAdminClient()
        const { data: rolePerm } = await adminSupabase
          .from('role_permissions')
          .select('permissions')
          .eq('role', adminSession.role)
          .single()

        const permissions = (rolePerm?.permissions as string[]) || []
        if (!permissions.includes(requiredPerm)) {
          const dashboardUrl = request.nextUrl.clone()
          dashboardUrl.pathname = '/admin/dashboard'
          dashboardUrl.searchParams.set('error', 'unauthorized')
          return NextResponse.redirect(dashboardUrl)
        }
      }
    }

    return supabaseResponse
  }

  // IMPORTANT: Do not add any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake can cause session issues.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', returnTo)
    return NextResponse.redirect(loginUrl)
  }

  if (isProtected && user && isBanActive(user.banned_until)) {
    await supabase.auth.signOut()
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('banned', '1')
    loginUrl.searchParams.set('next', returnTo)
    return NextResponse.redirect(loginUrl)
  }

  if (isProtected && user && !user.email_confirmed_at) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('unverified', '1')
    loginUrl.searchParams.set('next', returnTo)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
