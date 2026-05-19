export default function Loading() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-10 text-white">
      <div className="mx-auto h-2 max-w-5xl overflow-hidden rounded-full bg-[var(--panel)]">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-[var(--primary)]" />
      </div>
    </main>
  );
}
