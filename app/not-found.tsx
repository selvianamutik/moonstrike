import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--ms-bg-page)] px-6 text-[var(--ms-heading)]">
      <div className="max-w-md text-center">
        <p className="mono text-sm uppercase tracking-[0.28em] text-[var(--ms-gradient-end)]">404</p>
        <h1 className="font-display mt-4 text-4xl font-black">Signal lost</h1>
        <p className="mt-4 text-[var(--ms-body)]">The service route you requested is not active yet.</p>
        <Link
          href="/"
          className="ms-button mt-8 inline-flex rounded-lg px-5 py-3 text-sm font-bold"
        >
          Back to Moon Strike
        </Link>
      </div>
    </main>
  );
}
