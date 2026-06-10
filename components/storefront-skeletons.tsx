export function AuthCardSkeleton() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.2),transparent_28rem),var(--ms-bg-page)] px-5 py-16">
      <section className="ms-card w-full max-w-md rounded-xl p-8">
        <div className="h-8 w-44 animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-3 w-32 animate-pulse rounded bg-white/10" />
        <div className="mt-8 h-12 animate-pulse rounded-full bg-white/10" />
        <div className="mt-8 space-y-6">
          <div>
            <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
            <div className="mt-2 h-13 animate-pulse rounded-md bg-white/10" />
          </div>
          <div>
            <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
            <div className="mt-2 h-13 animate-pulse rounded-md bg-white/10" />
          </div>
          <div className="h-13 animate-pulse rounded-md bg-white/10" />
        </div>
      </section>
    </main>
  );
}

export function CartListSkeleton() {
  return (
    <div className="mt-8 space-y-5">
      {[0, 1, 2].map((item) => (
        <article key={item} className="ms-card rounded-xl p-5">
          <div className="grid gap-5 md:grid-cols-[120px_1fr_auto]">
            <div className="h-28 animate-pulse rounded-md bg-white/10" />
            <div>
              <div className="h-6 w-2/3 animate-pulse rounded bg-white/10" />
              <div className="mt-3 h-4 w-full animate-pulse rounded bg-white/10" />
              <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-white/10" />
              <div className="mt-5 grid gap-2 md:grid-cols-2">
                <div className="h-10 animate-pulse rounded-md bg-white/10" />
                <div className="h-10 animate-pulse rounded-md bg-white/10" />
              </div>
            </div>
            <div className="h-7 w-24 animate-pulse rounded bg-white/10" />
          </div>
        </article>
      ))}
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <div className="mt-12 space-y-6">
      <div className="h-7 w-48 animate-pulse rounded bg-white/10" />
      <div className="ms-card rounded-xl p-8">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-44 animate-pulse rounded-md bg-white/10" />
          <div className="h-44 animate-pulse rounded-md bg-white/10" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
            <div key={item} className="h-16 animate-pulse rounded-md bg-white/10" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] px-6 py-10 text-[var(--ms-heading)]">
      <div className="ms-shell">
        <div className="h-16 animate-pulse rounded-lg bg-white/10" />
        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="h-10 w-2/3 animate-pulse rounded bg-white/10" />
            <div className="mt-4 h-5 w-1/2 animate-pulse rounded bg-white/10" />
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-56 animate-pulse rounded-xl bg-white/10" />
              ))}
            </div>
          </div>
          <div className="h-96 animate-pulse rounded-xl bg-white/10" />
        </div>
      </div>
    </main>
  );
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-white/10 ${className}`} />;
}

function SkeletonCard({ imageHeight = "h-44" }: { imageHeight?: string }) {
  return (
    <article className="ms-card rounded-xl p-4">
      <SkeletonLine className={`${imageHeight} w-full rounded-lg`} />
      <SkeletonLine className="mt-5 h-5 w-3/4" />
      <SkeletonLine className="mt-3 h-4 w-full" />
      <SkeletonLine className="mt-2 h-4 w-2/3" />
      <div className="mt-5 flex items-center justify-between gap-4">
        <SkeletonLine className="h-7 w-24" />
        <SkeletonLine className="h-9 w-20 rounded-md" />
      </div>
    </article>
  );
}

export function StorefrontGridPageSkeleton({ type = "services" }: { type?: "games" | "services" }) {
  const cards = type === "games" ? 6 : 12;

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <div className="h-24 border-b border-[var(--ms-border)] bg-[var(--ms-bg-navbar)]/95" />
      <section className="ms-shell py-16">
        <SkeletonLine className="h-4 w-40" />
        <SkeletonLine className="mt-4 h-12 w-full max-w-xl" />
        <div className="mt-8 flex flex-wrap gap-3">
          {[0, 1, 2, 3, 4].map((item) => (
            <SkeletonLine key={item} className="h-10 w-24 rounded-md" />
          ))}
        </div>
        <div className="mt-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <SkeletonLine className="h-5 w-56" />
          <SkeletonLine className="h-11 w-full max-w-sm rounded-md" />
        </div>
        <div className={`mt-8 grid gap-6 ${type === "games" ? "md:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-4"}`}>
          {Array.from({ length: cards }, (_, index) => (
            <SkeletonCard key={index} imageHeight={type === "games" ? "h-52" : "h-40"} />
          ))}
        </div>
      </section>
    </main>
  );
}

export function GameServicesPageSkeleton() {
  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <div className="h-24 border-b border-[var(--ms-border)] bg-[var(--ms-bg-navbar)]/95" />
      <section className="ms-shell py-16">
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <SkeletonLine className="h-72 rounded-xl" />
          <div>
            <SkeletonLine className="h-4 w-36" />
            <SkeletonLine className="mt-4 h-14 w-2/3" />
            <SkeletonLine className="mt-4 h-5 w-full max-w-2xl" />
            <SkeletonLine className="mt-2 h-5 w-3/4" />
            <div className="mt-8 flex flex-wrap gap-3">
              {[0, 1, 2, 3].map((item) => (
                <SkeletonLine key={item} className="h-10 w-28 rounded-md" />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <SkeletonLine className="h-5 w-52" />
          <SkeletonLine className="h-11 w-full max-w-sm rounded-md" />
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }, (_, index) => (
            <SkeletonCard key={index} imageHeight="h-40" />
          ))}
        </div>
      </section>
    </main>
  );
}

export function ServiceDetailPageSkeleton() {
  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <div className="h-24 border-b border-[var(--ms-border)] bg-[var(--ms-bg-navbar)]/95" />
      <section className="ms-shell grid gap-12 py-20 lg:grid-cols-[1fr_390px]">
        <div>
          <SkeletonLine className="h-4 w-48" />
          <SkeletonLine className="mt-5 h-14 w-3/4" />
          <SkeletonLine className="mt-5 h-5 w-full max-w-3xl" />
          <SkeletonLine className="mt-3 h-5 w-2/3" />
          <div className="mt-10 flex gap-4">
            <SkeletonLine className="h-9 w-28 rounded-full" />
            <SkeletonLine className="h-9 w-24 rounded-full" />
          </div>
          <SkeletonLine className="mt-12 h-[380px] rounded-lg" />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <SkeletonLine key={item} className="h-32 rounded-lg" />
            ))}
          </div>
        </div>
        <aside className="ms-card h-fit rounded-xl p-6 lg:sticky lg:top-32">
          <SkeletonLine className="h-7 w-48" />
          <SkeletonLine className="mt-6 h-11 w-40 rounded-full" />
          <div className="mt-8 space-y-4">
            {[0, 1, 2].map((item) => (
              <SkeletonLine key={item} className="h-32 rounded-xl" />
            ))}
          </div>
          <SkeletonLine className="mt-8 h-16 rounded-md" />
          <SkeletonLine className="mt-5 h-14 rounded-md" />
        </aside>
      </section>
    </main>
  );
}

function ProfileSidebarSkeleton() {
  return (
    <aside className="ms-card h-fit rounded-xl p-6">
      <SkeletonLine className="mx-auto h-20 w-20 rounded-full" />
      <SkeletonLine className="mx-auto mt-5 h-6 w-32" />
      <SkeletonLine className="mx-auto mt-3 h-4 w-44" />
      <div className="mt-8 space-y-3">
        {[0, 1, 2, 3].map((item) => (
          <SkeletonLine key={item} className="h-11 rounded-md" />
        ))}
      </div>
    </aside>
  );
}

export function ProfileTablePageSkeleton() {
  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <div className="h-24 border-b border-[var(--ms-border)] bg-[var(--ms-bg-navbar)]/95" />
      <section className="ms-shell grid gap-8 py-16 lg:grid-cols-[270px_minmax(0,1fr)]">
        <ProfileSidebarSkeleton />
        <div>
          <SkeletonLine className="h-4 w-44" />
          <SkeletonLine className="mt-4 h-12 w-64" />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <SkeletonLine key={item} className="h-28 rounded-xl" />
            ))}
          </div>
          <div className="mt-8 space-y-4">
            {[0, 1, 2, 3, 4].map((item) => (
              <SkeletonLine key={item} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export function ProfileDetailPageSkeleton() {
  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <div className="h-24 border-b border-[var(--ms-border)] bg-[var(--ms-bg-navbar)]/95" />
      <section className="ms-shell grid gap-8 py-16 lg:grid-cols-[270px_minmax(0,1fr)]">
        <ProfileSidebarSkeleton />
        <div>
          <div className="flex flex-col justify-between gap-5 border-b border-[var(--ms-border)] pb-7 md:flex-row md:items-end">
            <div>
              <SkeletonLine className="h-4 w-56" />
              <SkeletonLine className="mt-4 h-12 w-72" />
              <SkeletonLine className="mt-3 h-5 w-64" />
            </div>
            <SkeletonLine className="h-11 w-32 rounded-full" />
          </div>
          <div className="mt-8 space-y-6">
            <SkeletonLine className="h-40 rounded-xl" />
            <SkeletonLine className="h-52 rounded-xl" />
            <SkeletonLine className="h-64 rounded-xl" />
          </div>
        </div>
      </section>
    </main>
  );
}

export function AdminTablePageSkeleton() {
  return (
    <div>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <SkeletonLine className="h-4 w-36" />
          <SkeletonLine className="mt-4 h-10 w-64" />
        </div>
        <SkeletonLine className="h-11 w-36 rounded-md" />
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <SkeletonLine key={item} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="mt-8 rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-4">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <SkeletonLine className="h-11 w-full max-w-sm rounded-md" />
          <SkeletonLine className="h-11 w-44 rounded-md" />
        </div>
        <div className="mt-6 space-y-3">
          {[0, 1, 2, 3, 4, 5, 6].map((item) => (
            <SkeletonLine key={item} className="h-14 rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminDetailPageSkeleton() {
  return (
    <div>
      <SkeletonLine className="h-4 w-48" />
      <SkeletonLine className="mt-4 h-10 w-72" />
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <SkeletonLine key={item} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <SkeletonLine className="h-56 rounded-xl" />
          <SkeletonLine className="h-72 rounded-xl" />
        </div>
        <SkeletonLine className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

export function AdminFormPageSkeleton() {
  return (
    <div>
      <SkeletonLine className="h-4 w-40" />
      <SkeletonLine className="mt-4 h-10 w-72" />
      <div className="mt-8 grid gap-6 xl:grid-cols-[260px_1fr]">
        <SkeletonLine className="h-80 rounded-xl" />
        <div className="space-y-5">
          {[0, 1, 2, 3, 4].map((item) => (
            <SkeletonLine key={item} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
