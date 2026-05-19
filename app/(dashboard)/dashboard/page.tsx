import { Frame18Sections } from "@/components/frame-18-sections";

export default function DashboardPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-5 py-10">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--accent)]">User system / phase 2</p>
        <h1 className="mt-3 text-4xl font-black">Order dashboard foundation</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {["Active Orders", "Purchase History", "Support Tickets"].map((item) => (
            <article key={item} className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-6">
              <h2 className="text-xl font-black">{item}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Placeholder route prepared for authenticated dashboard work after Supabase/Auth decisions.
              </p>
            </article>
          ))}
        </div>
      </section>
      <Frame18Sections />
    </>
  );
}
