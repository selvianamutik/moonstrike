import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 text-white">
      <div className="max-w-md text-center">
        <p className="font-mono text-sm uppercase tracking-[0.28em] text-[var(--accent)]">404</p>
        <h1 className="mt-4 font-[var(--font-display)] text-4xl font-black">Signal lost</h1>
        <p className="mt-4 text-[var(--muted)]">The service route you requested is not active yet.</p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] px-5 py-3 text-sm font-bold"
        >
          Back to Moon Strike
        </Link>
      </div>
    </main>
  );
}
