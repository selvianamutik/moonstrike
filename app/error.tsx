"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--ms-bg-page)] px-6 text-[var(--ms-heading)]">
      <div className="max-w-md text-center">
        <p className="mono text-sm uppercase tracking-[0.28em] text-[var(--ms-gradient-end)]">System error</p>
        <h1 className="font-display mt-4 text-4xl font-black">Checkout lane interrupted</h1>
        <button
          onClick={reset}
          className="ms-button mt-8 rounded-lg px-5 py-3 text-sm font-bold"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
