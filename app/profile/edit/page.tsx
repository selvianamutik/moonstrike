import { ProfileEditForm } from './ProfileEditForm'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { requireVerifiedUser } from '@/lib/auth/session'
import { getUserDisplayName } from '@/lib/auth/user-display'

export const dynamic = 'force-dynamic'

export default async function ProfileEditPage() {
  const user = await requireVerifiedUser('/profile/edit')
  const displayName = getUserDisplayName(user)
  const providers = Array.isArray(user.app_metadata.providers)
    ? user.app_metadata.providers.filter(
        (provider): provider is string => typeof provider === 'string'
      )
    : []

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />
      <section className="ms-shell py-16">
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
            initialProviders={providers}
          />
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
