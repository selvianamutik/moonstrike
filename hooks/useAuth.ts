'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
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

      if (
        error?.message.toLowerCase().includes('recovery email') ||
        error?.message.toLowerCase().includes('confirmation email')
      ) {
        return {
          data,
          error: new Error(
            'This email may already be registered or email delivery failed. Try logging in, continue with Google, or reset your password.'
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
