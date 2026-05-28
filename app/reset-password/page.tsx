'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

type ResetStatus = 'checking' | 'ready' | 'invalid'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { updatePassword, signOut } = useAuth()

  const [status, setStatus] = useState<ResetStatus>('checking')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setStatus(data.session ? 'ready' : 'invalid')
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setStatus('ready')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    const { error: updateError } = await updatePassword(password)

    if (updateError) {
      setError(updateError.message)
      setIsSubmitting(false)
      return
    }

    await signOut()
    router.push('/login?reset=success')
  }

  const renderPasswordToggle = (
    shown: boolean,
    onToggle: () => void,
    label: string
  ) => {
    const Icon = shown ? EyeOff : Eye

    return (
      <button
        type="button"
        aria-label={label}
        onClick={onToggle}
        className="ms-focus-ring ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--ms-body)] hover:text-[var(--ms-heading)]"
      >
        <Icon aria-hidden="true" size={18} strokeWidth={2} />
      </button>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.2),transparent_28rem),var(--ms-bg-page)] px-5 py-16 text-[var(--ms-heading)]">
      <section className="ms-card w-full max-w-md rounded-xl p-8 shadow-[0_24px_90px_rgba(0,0,0,0.42)]">
        <Link href="/" className="font-display text-3xl font-black tracking-[-0.04em]">
          <span className="brand-gradient">Moon Strike</span>
        </Link>
        <p className="mono mt-3 text-xs uppercase tracking-[0.22em] text-[var(--ms-gradient-end)]">
          Secure account recovery
        </p>

        <h1 className="font-display mt-8 text-2xl font-black">Set New Password</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--ms-body)]">
          Choose a strong password for your Moon Strike account.
        </p>

        {status === 'checking' && (
          <p className="mono mt-8 rounded-md border border-[var(--ms-border)] bg-[var(--ms-hover-bg)] px-4 py-3 text-xs leading-5 text-[var(--ms-body)]">
            Verifying reset link...
          </p>
        )}

        {status === 'invalid' && (
          <div className="mt-8">
            <p className="mono rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs leading-5 text-red-400">
              This reset link is invalid or expired. Request a new one from the login page.
            </p>
            <Link
              href="/login"
              className="ms-button mt-7 flex h-13 w-full items-center justify-center mono text-sm uppercase tracking-[0.16em]"
            >
              Back to Login
            </Link>
          </div>
        )}

        {status === 'ready' && (
          <form onSubmit={handleSubmit} className="mt-8">
            {error && (
              <p className="mono mb-6 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs leading-5 text-red-400">
                {error}
              </p>
            )}

            <label className="mono text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]" htmlFor="new-password">
              New Password
            </label>
            <div className="mt-2 flex h-13 items-center rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] px-4 focus-within:border-[var(--ms-gradient-end)]">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="min-w-0 flex-1 bg-transparent outline-none"
              />
              {renderPasswordToggle(
                showPassword,
                () => setShowPassword((current) => !current),
                showPassword ? 'Hide password' : 'Show password'
              )}
            </div>

            <label className="mono mt-6 block text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]" htmlFor="confirm-new-password">
              Confirm Password
            </label>
            <div className="mt-2 flex h-13 items-center rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] px-4 focus-within:border-[var(--ms-gradient-end)]">
              <input
                id="confirm-new-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your new password"
                className="min-w-0 flex-1 bg-transparent outline-none"
              />
              {renderPasswordToggle(
                showConfirmPassword,
                () => setShowConfirmPassword((current) => !current),
                showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="ms-button mt-7 flex h-13 w-full items-center justify-center mono text-sm uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Set New Password'}
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
