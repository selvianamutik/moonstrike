import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-[var(--background)] text-white">
      <header className="border-b border-[var(--border)] bg-black/20 px-5 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="font-[var(--font-display)] text-lg font-black uppercase">
            Moon Strike
          </Link>
          <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]">
            MVP preview
          </span>
        </div>
      </header>
      {children}
    </main>
  );
}
