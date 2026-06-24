'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

type SessionStatusPayload = {
  banned?: boolean
} | null

let lastSessionStatusCheckAt = 0
let sessionStatusInFlight: Promise<SessionStatusPayload> | null = null

async function loadSessionStatus({ force = false }: { force?: boolean } = {}) {
  const now = Date.now()

  if (!force && now - lastSessionStatusCheckAt < 60_000) return null
  if (sessionStatusInFlight) return sessionStatusInFlight

  lastSessionStatusCheckAt = now
  sessionStatusInFlight = fetch('/api/auth/session-status', {
    cache: 'no-store',
  })
    .then((response) => response.json().catch(() => null) as Promise<SessionStatusPayload>)
    .catch(() => null)
    .finally(() => {
      sessionStatusInFlight = null
    })

  return sessionStatusInFlight
}

export function useAuth() {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function checkSessionStatus({ force = false }: { force?: boolean } = {}) {
      if (!force && document.visibilityState !== 'visible') return
      const payload = await loadSessionStatus({ force })

      if (!isMounted || !payload?.banned) return

      await supabase.auth.signOut()
      setUser(null)
      setLoading(false)
      window.location.replace('/login?banned=1')
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return
      setUser(data.user)
      setLoading(false)
      if (data.user) void checkSessionStatus({ force: true })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) void checkSessionStatus({ force: true })
    })

    function handleSessionRefresh() {
      if (document.visibilityState !== 'visible') return
      void checkSessionStatus()
    }

    window.addEventListener('focus', handleSessionRefresh)
    document.addEventListener('visibilitychange', handleSessionRefresh)

    return () => {
      isMounted = false
      window.removeEventListener('focus', handleSessionRefresh)
      document.removeEventListener('visibilitychange', handleSessionRefresh)
      subscription.unsubscribe()
    }
  }, [supabase])

  const signIn = useCallback(
    async (email: string, password: string) => {
      // Check if account is locked before attempting login
      const lockCheckResponse = await fetch(
        `/api/auth/login-attempt?email=${encodeURIComponent(email)}`
      ).catch(() => null)
      
      if (lockCheckResponse?.ok) {
        const lockStatus = await lockCheckResponse.json().catch(() => ({}))
        if (lockStatus.locked) {
          const lockedUntil = lockStatus.lockedUntil ? new Date(lockStatus.lockedUntil) : null
          const minutesRemaining = lockedUntil
            ? Math.ceil((lockedUntil.getTime() - Date.now()) / 60000)
            : 30
          
          return {
            data: null,
            error: new Error(
              `Account is temporarily locked due to multiple failed login attempts. Please try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`
            ),
          }
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      
      if (!error && data.user) {
        // Successful login - reset login attempts
        await fetch('/api/auth/login-attempt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, success: true }),
        }).catch(() => null)
        
        await fetch('/api/auth/merge-chat', { method: 'POST' }).catch(() => null)
      } else if (error) {
        // Failed login - increment attempts
        const attemptResponse = await fetch('/api/auth/login-attempt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, success: false }),
        }).catch(() => null)
        
        if (attemptResponse?.status === 423) {
          const attemptData = await attemptResponse.json().catch(() => ({}))
          return {
            data: null,
            error: new Error(attemptData.message || 'Account is temporarily locked.'),
          }
        }
        
        if (attemptResponse?.ok) {
          const attemptData = await attemptResponse.json().catch(() => ({}))
          if (attemptData.message) {
            return {
              data: null,
              error: new Error(`${error.message}. ${attemptData.message}`),
            }
          }
        }
      }
      
      return { data, error }
    },
    [supabase]
  )

  const signUp = useCallback(
    async (email: string, password: string, username: string) => {
      const checkResponse = await fetch('/api/auth/register-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const checkPayload = await checkResponse.json().catch(() => ({}))

      if (!checkResponse.ok) {
        return {
          data: null,
          error: new Error(
            checkPayload.error ?? 'Unable to create account right now.'
          ),
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      // Supabase returns a user with empty identities when email already exists
      // (when email confirmation is enabled). Handle this explicitly.
      if (
        !error &&
        data?.user &&
        Array.isArray(data.user.identities) &&
        data.user.identities.length === 0
      ) {
        return {
          data: null,
          error: new Error(
            'This email is already registered. Go to Login and sign in with this email. If it is not verified yet, the Resend Verification button will appear there.'
          ),
        }
      }

      // These specific error messages from Supabase indicate email send failures,
      // not that the email is already registered.
      if (
        error?.message.toLowerCase().includes('recovery email') ||
        error?.message.toLowerCase().includes('confirmation email')
      ) {
        return {
          data,
          error: new Error(
            'Failed to send confirmation email. Please try again in a moment or contact support.'
          ),
        }
      }

      return { data, error }
    },
    [supabase]
  )

  const signInWithGoogle = useCallback(
    async (next?: string, intent: 'login' | 'register' = 'login') => {
      const redirectTo = new URL('/auth/callback', window.location.origin)
      if (next) redirectTo.searchParams.set('next', next)
      if (intent === 'register') redirectTo.searchParams.set('intent', 'register')

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectTo.toString() },
      })
      return { error }
    },
    [supabase]
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [supabase])

  const sendPasswordReset = useCallback(
    async (email: string) => {
      const response = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        return {
          error: new Error(payload.error ?? 'Unable to send reset link.'),
        }
      }

      return { error: null, data: payload }
    },
    []
  )

  const resendVerificationEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error }
  }, [supabase])

  const updatePassword = useCallback(
    async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      return { error }
    },
    [supabase]
  )

  const isVerified = user?.email_confirmed_at != null

  return {
    user,
    loading,
    isVerified,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    sendPasswordReset,
    resendVerificationEmail,
    updatePassword,
  }
}
