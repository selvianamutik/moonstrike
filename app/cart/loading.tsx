import { CartListSkeleton } from "@/components/storefront-skeletons";

export default function CartLoading() {
  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <div className="h-24 border-b border-[var(--ms-border)] bg-[var(--ms-bg-navbar)]/95" />
      <section className="ms-shell grid gap-10 py-16 lg:grid-cols-[1fr_390px]">
        <div>
          <div className="border-b border-[var(--ms-border)] pb-7">
            <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
            <div className="mt-3 h-12 w-80 animate-pulse rounded bg-white/10" />
          </div>
          <CartListSkeleton />
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-white/10" />
      </section>
    </main>
  );
}
