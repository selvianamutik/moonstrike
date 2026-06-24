import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const email =
    typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const success = body?.success === true

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    if (success) {
      // Reset login attempts on successful login
      await supabase.rpc('reset_customer_login_attempts', {
        user_email: email,
      })

      return NextResponse.json({ success: true })
    } else {
      // Increment failed login attempts
      const { data, error } = await supabase
        .rpc('increment_customer_failed_login', {
          user_email: email,
        })
        .single<{
          attempts: number
          is_locked: boolean
          locked_until_ts: string | null
        }>()

      if (error) {
        console.error('Error incrementing login attempts:', error)
        return NextResponse.json(
          { error: 'Failed to track login attempt.' },
          { status: 500 }
        )
      }

      if (data?.is_locked) {
        const lockedUntil = data.locked_until_ts
          ? new Date(data.locked_until_ts)
          : null
        const minutesRemaining = lockedUntil
          ? Math.ceil((lockedUntil.getTime() - Date.now()) / 60000)
          : 30

        return NextResponse.json(
          {
            locked: true,
            attempts: data.attempts,
            lockedUntil: data.locked_until_ts,
            message: `Account locked due to multiple failed login attempts. Please try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`,
          },
          { status: 423 }
        )
      }

      const remainingAttempts = 5 - (data?.attempts || 0)

      return NextResponse.json({
        locked: false,
        attempts: data?.attempts || 0,
        remainingAttempts,
        message:
          remainingAttempts > 0
            ? `${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining before account lockout.`
            : null,
      })
    }
  } catch (error) {
    console.error('Error handling login attempt:', error)
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const email = searchParams.get('email')?.trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    const { data, error } = await supabase
      .rpc('is_customer_account_locked', {
        user_email: email,
      })
      .single<{
        is_locked: boolean
        locked_until_ts: string | null
        attempts: number
      }>()

    if (error) {
      console.error('Error checking account lock status:', error)
      return NextResponse.json(
        { error: 'Failed to check account status.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      locked: data?.is_locked || false,
      lockedUntil: data?.locked_until_ts || null,
      attempts: data?.attempts || 0,
    })
  } catch (error) {
    console.error('Error checking account lock:', error)
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    )
  }
}
