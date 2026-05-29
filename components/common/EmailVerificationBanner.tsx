'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export function EmailVerificationBanner() {
  const { user, isVerified } = useAuth()
  const pathname = usePathname()
  const [resent, setResent] = useState(false)
  const [sending, setSending] = useState(false)

  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/reset-password' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/admin')
  ) {
    return null
  }

  if (!user || isVerified) return null

  const handleResend = async () => {
    setSending(true)
    const supabase = createClient()
    await supabase.auth.resend({
      type: 'signup',
      email: user.email!,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setResent(true)
    setSending(false)
  }

  return (
    <div className="flex w-full items-center justify-center gap-3 border-b border-[var(--ms-border)] bg-[rgba(139,92,246,0.12)] px-4 py-3 text-sm text-[var(--ms-heading)]">
      <span>Please verify your email to make purchases.</span>
      {!resent ? (
        <button
          type="button"
          onClick={handleResend}
          disabled={sending}
          className="font-semibold text-[var(--ms-gradient-end)] underline underline-offset-2 transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Resend email'}
        </button>
      ) : (
        <span className="text-[var(--ms-gradient-end)]">Email sent!</span>
      )}
    </div>
  )
}
