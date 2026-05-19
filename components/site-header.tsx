import Image from "next/image";
import Link from "next/link";
import { QuickSelectMenu } from "@/components/quick-select-menu";

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--background)]">
      <div className="ms-shell flex h-28 items-center gap-6">
        <Link href="/" className="text-2xl font-black tracking-[-0.03em] sm:text-3xl">
          <span className="brand-gradient">Moon Strike</span>
        </Link>
        <QuickSelectMenu />
        <div className="hidden h-13 flex-1 items-center rounded-md border border-[var(--border)] bg-[var(--panel)] px-5 text-[var(--muted)] lg:flex">
          <span className="mono text-sm">Search</span>
          <Image src="/assets/magnifien.png" alt="" width={22} height={22} className="ml-auto" />
        </div>
        <button className="ms-button hidden h-11 px-5 text-sm md:inline-flex">
          $ USD ↔
        </button>
        <nav className="ml-auto flex items-center gap-5 text-sm sm:gap-8">
          <Link href="/games" className="hidden text-center text-white sm:block">
            <span className="block text-lg">▣</span>
            Services
          </Link>
          <a href="#about" className="hidden text-center text-white sm:block">
            <span className="block text-lg">◇</span>
            About
          </a>
          <Link href="/dashboard" className="text-center text-white">
            <span className="block text-lg">♟</span>
            Profiles
          </Link>
        </nav>
      </div>
    </header>
  );
}
