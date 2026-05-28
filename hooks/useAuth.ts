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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      return { error }
    },
    [supabase]
  )

  const signInWithGoogle = useCallback(
    async (next?: string) => {
      const redirectTo = new URL('/auth/callback', window.location.origin)
      if (next) redirectTo.searchParams.set('next', next)

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
      const redirectTo = new URL('/auth/callback', window.location.origin)
      redirectTo.searchParams.set('next', '/reset-password')

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo.toString(),
      })
      return { error }
    },
    [supabase]
  )

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
    updatePassword,
  }
}
