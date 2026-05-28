'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

type AuthMode = 'login' | 'register' | 'reset'

function getSafeNext(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/profile'
  return value
}

function getCallbackMessage(key: string | null) {
  if (!key) return null
  if (key === 'auth_callback_failed') return 'Authentication failed. Please try again.'
  return key.replaceAll('_', ' ')
}

function PasswordToggle({
  shown,
  onToggle,
  label,
}: {
  shown: boolean
  onToggle: () => void
  label: string
}) {
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

function AuthCard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    signIn,
    signUp,
    signInWithGoogle,
    sendPasswordReset,
    user,
    loading,
  } = useAuth()

  const next = useMemo(
    () => getSafeNext(searchParams.get('next')),
    [searchParams]
  )
  const initialMode: AuthMode =
    searchParams.get('tab') === 'register' ? 'register' : 'login'

  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(
    getCallbackMessage(searchParams.get('error'))
  )
  const [notice, setNotice] = useState<string | null>(() => {
    if (searchParams.get('reset') === 'success') {
      return 'Password updated. You can log in with your new password.'
    }
    if (searchParams.get('unverified') === '1') {
      return 'Please verify your email before opening your profile or checkout.'
    }
    return null
  })
  const [registerSuccess, setRegisterSuccess] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  useEffect(() => {
    if (!loading && user?.email_confirmed_at) router.push(next)
  }, [loading, next, router, user])

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setError(null)
    setNotice(null)
    setRegisterSuccess(false)
    setResetSuccess(false)

    const params = new URLSearchParams(searchParams.toString())
    params.delete('error')
    params.delete('reset')
    params.delete('unverified')

    if (nextMode === 'register') params.set('tab', 'register')
    if (nextMode === 'login' || nextMode === 'reset') params.delete('tab')

    router.replace(`/login${params.size ? `?${params.toString()}` : ''}`, {
      scroll: false,
    })
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setIsSubmitting(true)

    const { error: signInError } = await signIn(email, password)
    setIsSubmitting(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    router.push(next)
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setNotice(null)

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    const { error: signUpError } = await signUp(email, password, username.trim())
    setIsSubmitting(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    setRegisterSuccess(true)
  }

  const handleResetRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setResetSuccess(false)
    setIsSubmitting(true)

    const { error: resetError } = await sendPasswordReset(resetEmail)
    setIsSubmitting(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setResetSuccess(true)
  }

  const handleGoogle = async () => {
    setError(null)
    const { error: googleError } = await signInWithGoogle(next)
    if (googleError) setError(googleError.message)
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.2),transparent_28rem),var(--ms-bg-page)] px-5 py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ms-gradient-start)] border-t-transparent" />
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.2),transparent_28rem),var(--ms-bg-page)] px-5 py-16 text-[var(--ms-heading)]">
      <section className="ms-card w-full max-w-md rounded-xl p-8 shadow-[0_24px_90px_rgba(0,0,0,0.42)]">
        <Link href="/" className="font-display text-3xl font-black tracking-[-0.04em]">
          <span className="brand-gradient">Moon Strike</span>
        </Link>
        <p className="mono mt-3 text-xs uppercase tracking-[0.22em] text-[var(--ms-gradient-end)]">
          Dominate the game
        </p>

        {mode !== 'reset' && (
          <div className="mt-8 grid grid-cols-2 rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-1 mono text-xs uppercase tracking-[0.16em]">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`rounded-full px-4 py-3 text-center ${
                mode === 'login'
                  ? 'bg-[var(--primary)] text-[var(--ms-heading)]'
                  : 'text-[var(--ms-body)] hover:text-[var(--ms-heading)]'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`rounded-full px-4 py-3 text-center ${
                mode === 'register'
                  ? 'bg-[var(--primary)] text-[var(--ms-heading)]'
                  : 'text-[var(--ms-body)] hover:text-[var(--ms-heading)]'
              }`}
            >
              Register
            </button>
          </div>
        )}

        {error && (
          <p className="mono mt-6 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs leading-5 text-red-400">
            {error}
          </p>
        )}

        {notice && (
          <p className="mono mt-6 rounded-md border border-[var(--ms-border)] bg-[var(--ms-hover-bg)] px-4 py-3 text-xs leading-5 text-[var(--ms-body)]">
            {notice}
          </p>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="mt-8">
            <label className="mono text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="player@moonstrike.gg"
              className="mt-2 h-13 w-full rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] px-4 outline-none focus:border-[var(--ms-gradient-end)]"
            />

            <label className="mono mt-6 block text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]" htmlFor="login-password">
              Password
            </label>
            <div className="mt-2 flex h-13 items-center rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] px-4 focus-within:border-[var(--ms-gradient-end)]">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="min-w-0 flex-1 bg-transparent outline-none"
              />
              <PasswordToggle
                shown={showPassword}
                onToggle={() => setShowPassword((current) => !current)}
                label={showPassword ? 'Hide password' : 'Show password'}
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => switchMode('reset')}
                className="text-sm text-[var(--ms-gradient-end)] hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="ms-button mt-7 flex h-13 w-full items-center justify-center mono text-sm uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </form>
        )}

        {mode === 'register' && (
          registerSuccess ? (
            <div className="mt-8">
              <h2 className="font-display text-xl font-black">Verify your email</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--ms-body)]">
                We sent a confirmation link to {email}. After verification, come back here to log in.
              </p>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="ms-button mt-7 flex h-13 w-full items-center justify-center mono text-sm uppercase tracking-[0.16em]"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="mt-8">
              <label className="mono text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]" htmlFor="register-username">
                Username
              </label>
              <input
                id="register-username"
                type="text"
                required
                minLength={3}
                maxLength={32}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="NightfallRunner"
                className="mt-2 h-13 w-full rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] px-4 outline-none focus:border-[var(--ms-gradient-end)]"
              />

              <label className="mono mt-6 block text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]" htmlFor="register-email">
                Email
              </label>
              <input
                id="register-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="player@moonstrike.gg"
                className="mt-2 h-13 w-full rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] px-4 outline-none focus:border-[var(--ms-gradient-end)]"
              />

              <label className="mono mt-6 block text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]" htmlFor="register-password">
                Password
              </label>
              <div className="mt-2 flex h-13 items-center rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] px-4 focus-within:border-[var(--ms-gradient-end)]">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="min-w-0 flex-1 bg-transparent outline-none"
                />
                <PasswordToggle
                  shown={showPassword}
                  onToggle={() => setShowPassword((current) => !current)}
                  label={showPassword ? 'Hide password' : 'Show password'}
                />
              </div>

              <label className="mono mt-6 block text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]" htmlFor="register-confirm-password">
                Confirm Password
              </label>
              <div className="mt-2 flex h-13 items-center rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] px-4 focus-within:border-[var(--ms-gradient-end)]">
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="min-w-0 flex-1 bg-transparent outline-none"
                />
                <PasswordToggle
                  shown={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((current) => !current)}
                  label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="ms-button mt-7 flex h-13 w-full items-center justify-center mono text-sm uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )
        )}

        {mode === 'reset' && (
          <form onSubmit={handleResetRequest} className="mt-8">
            <h2 className="font-display text-xl font-black">Reset Password</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--ms-body)]">
              Enter your email and we will send a secure reset link.
            </p>

            {resetSuccess && (
              <p className="mono mt-5 rounded-md border border-[var(--ms-border)] bg-[var(--ms-hover-bg)] px-4 py-3 text-xs leading-5 text-[var(--ms-body)]">
                Reset link sent. Check your inbox, then follow the link to set a new password.
              </p>
            )}

            <label className="mono mt-6 block text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]" htmlFor="reset-email">
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              required
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="player@moonstrike.gg"
              className="mt-2 h-13 w-full rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] px-4 outline-none focus:border-[var(--ms-gradient-end)]"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="ms-button mt-7 flex h-13 w-full items-center justify-center mono text-sm uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              onClick={() => switchMode('login')}
              className="mono mt-6 w-full text-center text-xs uppercase tracking-[0.16em] text-[var(--ms-gradient-end)] hover:underline"
            >
              Back to Login
            </button>
          </form>
        )}

        {mode !== 'reset' && !registerSuccess && (
          <>
            <div className="my-8 flex items-center gap-4">
              <span className="h-px flex-1 bg-[var(--ms-border)]" />
              <span className="mono text-xs uppercase tracking-[0.18em] text-[var(--ms-body)]">
                Google OAuth
              </span>
              <span className="h-px flex-1 bg-[var(--ms-border)]" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              className="h-13 w-full rounded-md border border-[var(--ms-border)] bg-[var(--ms-bg-card)] mono text-sm uppercase tracking-[0.14em] text-[var(--ms-heading)] hover:border-[var(--ms-gradient-end)]"
            >
              Continue with Google
            </button>
          </>
        )}
      </section>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[var(--ms-bg-page)]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ms-gradient-start)] border-t-transparent" />
        </main>
      }
    >
      <AuthCard />
    </Suspense>
  )
}
