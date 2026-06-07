import { ProfileEditForm } from './ProfileEditForm'
import { ProfileSidebar } from '@/components/profile/ProfileSidebar'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { requireVerifiedUser } from '@/lib/auth/session'
import { formatMemberSince, getUserDisplayName, getUserInitials } from '@/lib/auth/user-display'

export const dynamic = 'force-dynamic'

export default async function ProfileEditPage() {
  const user = await requireVerifiedUser('/profile/edit')
  const displayName = getUserDisplayName(user)
  const initials = getUserInitials(displayName, user.email)
  const memberSince = formatMemberSince(user.created_at)
  const providers = Array.isArray(user.app_metadata.providers)
    ? user.app_metadata.providers.filter(
        (provider): provider is string => typeof provider === 'string'
      )
    : []
  const initialProviders =
    (user.user_metadata?.has_email_password === true ||
      user.app_metadata?.has_email_password === true) &&
    !providers.includes('email')
      ? [...providers, 'email_password']
      : providers

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />
      <section className="ms-shell grid gap-8 py-16 lg:grid-cols-[270px_minmax(0,1fr)]">
        <ProfileSidebar displayName={displayName} email={user.email} initials={initials} memberSince={memberSince} />

        <div>
          <div className="border-b border-[var(--ms-border)] pb-7">
            <p className="mono text-xs uppercase tracking-[0.28em] text-[var(--ms-gradient-end)]">
              Customer Profile
            </p>
            <h1 className="font-display mt-3 text-4xl font-black tracking-[-0.05em]">
              Edit profile
            </h1>
          </div>

          <div className="mt-8">
          <ProfileEditForm
            email={user.email ?? ''}
            initialUsername={displayName}
            initialProviders={initialProviders}
          />
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
