import Image from "next/image";
import Link from "next/link";
import { QuickSelectMenu } from "@/components/quick-select-menu";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--ms-border)] bg-[var(--ms-bg-navbar)]/95 backdrop-blur">
      <div className="ms-shell flex min-h-24 items-center gap-4 py-4">
        <Link href="/" className="font-display shrink-0 text-2xl font-black tracking-[-0.03em] sm:text-3xl">
          <span className="brand-gradient">Moon Strike</span>
        </Link>

        <QuickSelectMenu />

        <form className="hidden h-12 flex-1 items-center rounded-md border border-[var(--ms-border)] bg-[var(--ms-bg-card)] px-4 text-[var(--ms-body)] lg:flex">
          <label htmlFor="site-search" className="sr-only">
            Search services
          </label>
          <input
            id="site-search"
            type="search"
            placeholder="Search services"
            className="w-full bg-transparent mono text-sm outline-none"
          />
          <button type="submit" aria-label="Search" className="ms-focus-ring rounded p-1">
            <Image src="/assets/magnifien.png" alt="" width={22} height={22} />
          </button>
        </form>

        <button className="ms-button hidden h-11 px-4 mono text-xs uppercase tracking-[0.16em] md:inline-flex">
          US USD / EUR
        </button>

        <div className="hidden xl:block">
          <ThemeToggle />
        </div>

        <nav className="ml-auto flex items-center gap-4 text-sm font-semibold text-[var(--ms-heading)] sm:gap-6">
          <Link href="/services" className="hidden text-center hover:text-[var(--ms-gradient-end)] sm:block">
            <span className="mono block text-xs text-[var(--ms-gradient-end)]">MENU</span>
            Services
          </Link>
          <a href="#about" className="hidden text-center hover:text-[var(--ms-gradient-end)] sm:block">
            <span className="mono block text-xs text-[var(--ms-gradient-end)]">INFO</span>
            About
          </a>
          <Link href="/profile" className="text-center hover:text-[var(--ms-gradient-end)]">
            <span className="mono block text-xs text-[var(--ms-gradient-end)]">USER</span>
            Profiles
          </Link>
        </nav>
      </div>
    </header>
  );
}
