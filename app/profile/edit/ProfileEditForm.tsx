'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type ProfileEditFormProps = {
  email: string
  initialUsername: string
  initialProviders: string[]
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

export function ProfileEditForm({
  email,
  initialUsername,
  initialProviders,
}: ProfileEditFormProps) {
  const router = useRouter()
  const [providers, setProviders] = useState(initialProviders)
  const [username, setUsername] = useState(initialUsername)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [accountPassword, setAccountPassword] = useState('')
  const [confirmAccountPassword, setConfirmAccountPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showAccountPassword, setShowAccountPassword] = useState(false)
  const [showConfirmAccountPassword, setShowConfirmAccountPassword] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false)
  const [isAddingPassword, setIsAddingPassword] = useState(false)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [accountMessage, setAccountMessage] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [accountError, setAccountError] = useState<string | null>(null)

  const hasEmailProvider = providers.includes('email')
  const hasGoogleProvider = providers.includes('google')
  const emailLoginConnected = hasEmailProvider || providers.includes('email_password')

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/login?next=/profile/edit')
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace('/login?next=/profile/edit')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const requireActiveSession = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace('/login?next=/profile/edit')
      return null
    }

    if (user.email?.toLowerCase() !== email.toLowerCase()) {
      router.replace('/login?next=/profile/edit')
      return null
    }

    const nextProviders = Array.isArray(user.app_metadata.providers)
      ? user.app_metadata.providers.filter(
          (provider): provider is string => typeof provider === 'string'
        )
      : []
    setProviders(
      (user.user_metadata?.has_email_password === true ||
        user.app_metadata?.has_email_password === true) &&
        !nextProviders.includes('email')
        ? [...nextProviders, 'email_password']
        : nextProviders
    )

    return { supabase, user, providers: nextProviders }
  }

  const refreshSessionState = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const nextProviders = Array.isArray(user.app_metadata.providers)
      ? user.app_metadata.providers.filter(
          (provider): provider is string => typeof provider === 'string'
        )
      : []

    setProviders(
      user.user_metadata?.has_email_password === true &&
        !nextProviders.includes('email')
        ? [...nextProviders, 'email_password']
        : nextProviders
    )

    return user
  }

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmedUsername = username.trim()
    setProfileError(null)
    setProfileMessage(null)

    if (trimmedUsername.length < 3) {
      setProfileError('Username must be at least 3 characters.')
      return
    }

    if (trimmedUsername.length > 32) {
      setProfileError('Username must be 32 characters or fewer.')
      return
    }

    setIsSavingProfile(true)
    const activeSession = await requireActiveSession()
    if (!activeSession) {
      setIsSavingProfile(false)
      return
    }

    const { supabase } = activeSession
    const { error } = await supabase.auth.updateUser({
      data: { username: trimmedUsername },
    })
    setIsSavingProfile(false)

    if (error) {
      setProfileError(error.message)
      return
    }

    setProfileMessage('Profile updated.')
    router.refresh()
  }

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordMessage(null)

    if (!currentPassword) {
      setPasswordError('Enter your current password.')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }

    setIsSavingPassword(true)
    const activeSession = await requireActiveSession()
    if (!activeSession) {
      setIsSavingPassword(false)
      return
    }

    const { supabase } = activeSession

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
      current_password: currentPassword,
    })
    setIsSavingPassword(false)

    if (updateError) {
      setPasswordError(updateError.message)
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordMessage('Password updated.')
  }

  const handleConnectGoogle = async () => {
    setAccountError(null)
    setAccountMessage(null)
    setIsConnectingGoogle(true)

    const activeSession = await requireActiveSession()
    if (!activeSession) {
      setIsConnectingGoogle(false)
      return
    }

    const redirectTo = new URL('/auth/callback', window.location.origin)
    redirectTo.searchParams.set('next', '/profile/edit')

    const { error } = await activeSession.supabase.auth.linkIdentity({
      provider: 'google',
      options: { redirectTo: redirectTo.toString() },
    })

    setIsConnectingGoogle(false)

    if (error) {
      setAccountError(error.message)
    }
  }

  const handleAddPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAccountError(null)
    setAccountMessage(null)

    if (accountPassword.length < 8) {
      setAccountError('Password must be at least 8 characters.')
      return
    }

    if (accountPassword !== confirmAccountPassword) {
      setAccountError('Passwords do not match.')
      return
    }

    setIsAddingPassword(true)
    const activeSession = await requireActiveSession()
    if (!activeSession) {
      setIsAddingPassword(false)
      return
    }

    const { error } = await activeSession.supabase.auth.updateUser({
      password: accountPassword,
      data: { has_email_password: true },
    })

    if (error) {
      const passwordAlreadyExists = error.message
        .toLowerCase()
        .includes('different from the old password')

      if (!passwordAlreadyExists) {
        setIsAddingPassword(false)
        setAccountError(error.message)
        return
      }

      const { error: metadataError } = await activeSession.supabase.auth.updateUser({
        data: { has_email_password: true },
      })

      if (metadataError) {
        setIsAddingPassword(false)
        setAccountError(metadataError.message)
        return
      }
    }

    await activeSession.supabase.auth.refreshSession()
    await refreshSessionState()
    setIsAddingPassword(false)
    setAccountPassword('')
    setConfirmAccountPassword('')
    setProviders((current) =>
      current.includes('email') || current.includes('email_password')
        ? current
        : [...current, 'email_password']
    )
    setAccountMessage('Email password added. You can now log in with email and password.')
    router.refresh()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="ms-card rounded-xl p-6">
        <h2 className="font-display text-2xl font-black">Profile Details</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--ms-body)]">
          Your email is managed by Supabase Auth. Username changes apply to your auth metadata.
        </p>

        <form onSubmit={handleProfileSubmit} className="mt-6 space-y-5">
          <div>
            <label className="mono text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]" htmlFor="profile-email">
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              value={email}
              readOnly
              className="mt-2 h-13 w-full rounded-md border border-[var(--ms-border)] bg-[var(--ms-hover-bg)] px-4 text-[var(--ms-body)] outline-none"
            />
          </div>

          <div>
            <label className="mono text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]" htmlFor="profile-username">
              Username
            </label>
            <input
              id="profile-username"
              type="text"
              required
              minLength={3}
              maxLength={32}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 h-13 w-full rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] px-4 outline-none focus:border-[var(--ms-gradient-end)]"
            />
          </div>

          {profileError && (
            <p className="mono rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs leading-5 text-red-400">
              {profileError}
            </p>
          )}

          {profileMessage && (
            <p className="mono rounded-md border border-[var(--ms-border)] bg-[var(--ms-hover-bg)] px-4 py-3 text-xs leading-5 text-[var(--ms-body)]">
              {profileMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSavingProfile}
            className="ms-button h-11 px-5 mono text-xs uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </section>

      <section className="ms-card rounded-xl p-6">
        <h2 className="font-display text-2xl font-black">Password</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--ms-body)]">
          Confirm your current password before choosing a new one.
        </p>

        <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-5">
          <div>
            <label className="mono text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]" htmlFor="current-password">
              Current Password
            </label>
            <div className="mt-2 flex h-13 items-center rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] px-4 focus-within:border-[var(--ms-gradient-end)]">
              <input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="min-w-0 flex-1 bg-transparent outline-none"
              />
              <PasswordToggle
                shown={showCurrentPassword}
                onToggle={() => setShowCurrentPassword((current) => !current)}
                label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
              />
            </div>
          </div>

          <div>
            <label className="mono text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]" htmlFor="new-password">
              New Password
            </label>
            <div className="mt-2 flex h-13 items-center rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] px-4 focus-within:border-[var(--ms-gradient-end)]">
              <input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="min-w-0 flex-1 bg-transparent outline-none"
              />
              <PasswordToggle
                shown={showNewPassword}
                onToggle={() => setShowNewPassword((current) => !current)}
                label={showNewPassword ? 'Hide new password' : 'Show new password'}
              />
            </div>
          </div>

          <div>
            <label className="mono text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]" htmlFor="confirm-password">
              Confirm New Password
            </label>
            <div className="mt-2 flex h-13 items-center rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] px-4 focus-within:border-[var(--ms-gradient-end)]">
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="min-w-0 flex-1 bg-transparent outline-none"
              />
              <PasswordToggle
                shown={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((current) => !current)}
                label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              />
            </div>
          </div>

          {passwordError && (
            <p className="mono rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs leading-5 text-red-400">
              {passwordError}
            </p>
          )}

          {passwordMessage && (
            <p className="mono rounded-md border border-[var(--ms-border)] bg-[var(--ms-hover-bg)] px-4 py-3 text-xs leading-5 text-[var(--ms-body)]">
              {passwordMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSavingPassword}
            className="ms-button h-11 px-5 mono text-xs uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingPassword ? 'Saving...' : 'Update Password'}
          </button>
        </form>
      </section>

      <section className="ms-card rounded-xl p-6 lg:col-span-2">
        <h2 className="font-display text-2xl font-black">Connected Accounts</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--ms-body)]">
          Add sign-in methods to the same Moon Strike account. New connections require your current session.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold">Email Password</h3>
                <p className="mt-1 text-sm text-[var(--ms-body)]">
                  {emailLoginConnected
                    ? 'Email/password login is enabled.'
                    : 'Add a password so this Google account can also use email login.'}
                </p>
              </div>
              <span className="mono rounded-full border border-[var(--ms-border)] px-3 py-1 text-[10px] uppercase text-[var(--ms-body)]">
                {emailLoginConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>

            {!emailLoginConnected && (
              <form onSubmit={handleAddPassword} className="mt-5 space-y-4">
                <div>
                  <label className="mono text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]" htmlFor="account-password">
                    New Password
                  </label>
                  <div className="mt-2 flex h-13 items-center rounded-md border border-[var(--ms-border)] bg-[var(--ms-bg-card)] px-4 focus-within:border-[var(--ms-gradient-end)]">
                    <input
                      id="account-password"
                      type={showAccountPassword ? 'text' : 'password'}
                      value={accountPassword}
                      onChange={(e) => setAccountPassword(e.target.value)}
                      className="min-w-0 flex-1 bg-transparent outline-none"
                    />
                    <PasswordToggle
                      shown={showAccountPassword}
                      onToggle={() => setShowAccountPassword((current) => !current)}
                      label={showAccountPassword ? 'Hide password' : 'Show password'}
                    />
                  </div>
                </div>

                <div>
                  <label className="mono text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]" htmlFor="confirm-account-password">
                    Confirm Password
                  </label>
                  <div className="mt-2 flex h-13 items-center rounded-md border border-[var(--ms-border)] bg-[var(--ms-bg-card)] px-4 focus-within:border-[var(--ms-gradient-end)]">
                    <input
                      id="confirm-account-password"
                      type={showConfirmAccountPassword ? 'text' : 'password'}
                      value={confirmAccountPassword}
                      onChange={(e) => setConfirmAccountPassword(e.target.value)}
                      className="min-w-0 flex-1 bg-transparent outline-none"
                    />
                    <PasswordToggle
                      shown={showConfirmAccountPassword}
                      onToggle={() => setShowConfirmAccountPassword((current) => !current)}
                      label={showConfirmAccountPassword ? 'Hide confirm password' : 'Show confirm password'}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAddingPassword}
                  className="ms-button h-11 px-5 mono text-xs uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAddingPassword ? 'Saving...' : 'Add Email Login'}
                </button>
              </form>
            )}
          </div>

          <div className="rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold">Google</h3>
                <p className="mt-1 text-sm text-[var(--ms-body)]">
                  {hasGoogleProvider
                    ? 'Google sign-in is connected.'
                    : 'Connect Google as another way to sign in.'}
                </p>
              </div>
              <span className="mono rounded-full border border-[var(--ms-border)] px-3 py-1 text-[10px] uppercase text-[var(--ms-body)]">
                {hasGoogleProvider ? 'Connected' : 'Not Connected'}
              </span>
            </div>

            {!hasGoogleProvider && (
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={isConnectingGoogle}
                className="mt-5 h-11 rounded-md border border-[var(--ms-border)] px-5 text-sm text-[var(--ms-heading)] hover:border-[var(--ms-gradient-end)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isConnectingGoogle ? 'Opening Google...' : 'Connect Google'}
              </button>
            )}
          </div>
        </div>

        {accountError && (
          <p className="mono mt-5 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs leading-5 text-red-400">
            {accountError}
          </p>
        )}

        {accountMessage && (
          <p className="mono mt-5 rounded-md border border-[var(--ms-border)] bg-[var(--ms-hover-bg)] px-4 py-3 text-xs leading-5 text-[var(--ms-body)]">
            {accountMessage}
          </p>
        )}
      </section>

      <div className="lg:col-span-2">
        <Link
          href="/profile"
          className="inline-flex h-11 items-center justify-center rounded-md border border-[var(--ms-border)] px-5 text-sm text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-heading)]"
        >
          Back to Profile
        </Link>
      </div>
    </div>
  )
}
