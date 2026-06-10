import { CheckoutSkeleton } from "@/components/storefront-skeletons";

export default function CheckoutLoading() {
  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <div className="h-20 border-b border-[var(--ms-border)] bg-[var(--ms-bg-page)]" />
      <section className="mx-auto grid max-w-7xl gap-12 px-10 py-20 lg:grid-cols-[1fr_450px]">
        <div>
          <div className="h-12 w-72 animate-pulse rounded bg-white/10" />
          <div className="mt-4 h-5 w-96 animate-pulse rounded bg-white/10" />
          <CheckoutSkeleton />
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-white/10" />
      </section>
    </main>
  );
}
