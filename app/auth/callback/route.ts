import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

function getSafeNext(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/profile'
  return value
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = getSafeNext(searchParams.get('next'))
  const error = searchParams.get('error')
  const errorCode = searchParams.get('error_code')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    const loginUrl = new URL('/login', origin)
    loginUrl.searchParams.set('error', error)
    if (errorCode) loginUrl.searchParams.set('error_code', errorCode)
    if (errorDescription) {
      loginUrl.searchParams.set('error_description', errorDescription)
    }
    return NextResponse.redirect(loginUrl)
  }

  if (code) {
    const supabase = await createClient()
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (!sessionError) {
      const redirectUrl = new URL(next, origin)
      return NextResponse.redirect(redirectUrl)
    }

    const loginUrl = new URL('/login', origin)
    loginUrl.searchParams.set('error', 'auth_callback_failed')
    loginUrl.searchParams.set('error_description', sessionError.message)
    return NextResponse.redirect(loginUrl)
  }

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error: otpError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    })

    if (!otpError) {
      const redirectUrl = new URL(next, origin)
      return NextResponse.redirect(redirectUrl)
    }

    const loginUrl = new URL('/login', origin)
    loginUrl.searchParams.set('error', 'auth_callback_failed')
    loginUrl.searchParams.set('error_description', otpError.message)
    return NextResponse.redirect(loginUrl)
  }

  const loginUrl = new URL('/login', origin)
  loginUrl.searchParams.set('error', 'auth_callback_failed')
  loginUrl.searchParams.set(
    'error_description',
    'The auth callback did not include a usable code or recovery token.'
  )
  return NextResponse.redirect(loginUrl)
}
