"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 text-white">
      <div className="max-w-md text-center">
        <p className="font-mono text-sm uppercase tracking-[0.28em] text-[var(--accent)]">System error</p>
        <h1 className="mt-4 font-[var(--font-display)] text-4xl font-black">Checkout lane interrupted</h1>
        <button
          onClick={reset}
          className="mt-8 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] px-5 py-3 text-sm font-bold"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
