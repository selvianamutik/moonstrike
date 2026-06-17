"use client";

import Link from "next/link";
import { LogIn, Search, ShoppingCart, User, Gamepad2, Bell, CircleUserRound } from "lucide-react";
import { QuickSelectMenu } from "@/components/quick-select-menu";
import { SiteSearchOverlay } from "@/components/site-search-overlay";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDollarSign, faEuroSign } from "@fortawesome/free-solid-svg-icons";

export function SiteHeader() {
  const { user, loading } = useAuth();
  const { currency, toggleCurrency } = useCurrency();
  const isLoggedIn = Boolean(user);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--ms-border)] bg-[var(--ms-bg-navbar)]/95 backdrop-blur">
      <div className="top-nav-user flex min-h-24 items-center gap-12 py-0">
        <Link href="/" className="font-display shrink-0 text-2xl font-black tracking-[-0.03em] sm:text-3xl">
          <span className="brand-gradient">Moon Strike</span>
        </Link>

        <QuickSelectMenu />

        <SiteSearchOverlay />

        <button
          type="button"
          onClick={toggleCurrency}
          className="ms-button hidden h-11 px-4 mono text-xs uppercase tracking-[0.16em] md:inline-flex"
          aria-label="Toggle currency"
        >
          <FontAwesomeIcon icon={currency === "USD" ? faDollarSign : faEuroSign} /> {currency === "USD" ? "USD" : "EUR"}
        </button>

        <div className="hidden xl:block">
          <ThemeToggle />
        </div>

        <nav className="ml-auto flex items-center gap-8 text-sm font-semibold text-[var(--ms-heading)] sm:gap-6">
          <Link href="/games" className="hidden text-center hover:text-[var(--ms-gradient-end)] sm:block">
            <Gamepad2 size={22} className="mt-1 mx-auto" aria-hidden="true" />
            Games
          </Link>

          <Link href="/cart" className="flex flex-col items-center hover:text-[var(--ms-gradient-end)]" aria-label="Cart">
            <ShoppingCart size={22} className="mt-1" aria-hidden="true" />
            Cart
          </Link>

          <button type="button" aria-label="Notifications (coming soon)" className="hidden text-center hover:text-[var(--ms-gradient-end)] sm:block cursor-pointer">
            <Bell size={22} className="mt-1 mx-auto" aria-hidden="true"/>
            Notif
          </button>

          {loading ? (
            <div className="h-11 w-11 animate-pulse rounded bg-white/5" />
          ) : isLoggedIn ? (
            <Link href="/profile" className="flex flex-col items-center hover:text-[var(--ms-gradient-end)]" aria-label="Profile">
              <CircleUserRound size={23} className="mt-1" aria-hidden="true" />
              User
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


