"use client";

import Link from "next/link";
import { LogIn, Search, ShoppingCart, User } from "lucide-react";
import { QuickSelectMenu } from "@/components/quick-select-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";

export function SiteHeader() {
  const { user, loading } = useAuth();
  const { currency, toggleCurrency } = useCurrency();
  const isLoggedIn = Boolean(user);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--ms-border)] bg-[var(--ms-bg-navbar)]/95 backdrop-blur">
      <div className="ms-shell flex min-h-24 items-center gap-4 py-4">
        <Link href="/" className="font-display shrink-0 text-2xl font-black tracking-[-0.03em] sm:text-3xl">
          <span className="brand-gradient">Moon Strike</span>
        </Link>

        <QuickSelectMenu />

        <form
          action="/services"
          className="hidden h-12 flex-1 items-center rounded-md border border-[var(--ms-border)] bg-[var(--ms-bg-card)] px-4 text-[var(--ms-body)] lg:flex"
        >
          <label htmlFor="site-search" className="sr-only">
            Search services
          </label>
          <input
            id="site-search"
            name="q"
            type="search"
            placeholder="Search games, services..."
            className="w-full bg-transparent mono text-sm outline-none"
          />
          <button type="submit" aria-label="Search" className="ms-focus-ring rounded p-1">
            <Search size={20} aria-hidden="true" />
          </button>
        </form>

        <button
          type="button"
          onClick={toggleCurrency}
          className="ms-button hidden h-11 px-4 mono text-xs uppercase tracking-[0.16em] md:inline-flex"
          aria-label="Toggle currency"
        >
          {currency === "USD" ? "$ USD" : "EUR"}
        </button>

        <div className="hidden xl:block">
          <ThemeToggle />
        </div>

        <nav className="ml-auto flex items-center gap-4 text-sm font-semibold text-[var(--ms-heading)] sm:gap-6">
          <Link href="/services" className="hidden text-center hover:text-[var(--ms-gradient-end)] sm:block">
            <span className="mono block text-xs text-[var(--ms-gradient-end)]">MENU</span>
            Services
          </Link>

          <Link href="/#about" className="hidden text-center hover:text-[var(--ms-gradient-end)] sm:block">
            <span className="mono block text-xs text-[var(--ms-gradient-end)]">INFO</span>
            About
          </Link>

          <Link href="/cart" className="flex flex-col items-center hover:text-[var(--ms-gradient-end)]" aria-label="Cart">
            <span className="mono hidden text-xs text-[var(--ms-gradient-end)] sm:block">CART</span>
            <ShoppingCart size={22} className="mt-1" aria-hidden="true" />
          </Link>

          {loading ? (
            <div className="h-11 w-11 animate-pulse rounded bg-white/5" />
          ) : isLoggedIn ? (
            <Link href="/profile" className="flex flex-col items-center hover:text-[var(--ms-gradient-end)]" aria-label="Profile">
              <span className="mono hidden text-xs text-[var(--ms-gradient-end)] sm:block">USER</span>
              <User size={23} className="mt-1" aria-hidden="true" />
            </Link>
          ) : (
            <Link href="/login" className="ms-button h-11 px-3 mono text-xs uppercase tracking-[0.16em] md:px-4">
              <LogIn size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Login</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
