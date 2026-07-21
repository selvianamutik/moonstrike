"use client";

import Link from "next/link";
import { LogIn, Search, ShoppingCart, User, Gamepad2, CircleUserRound, BookOpen, Newspaper } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
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
          {/* <span className="brand-gradient">Moon Strike</span> */}
          <img src={'/logo/logo.png'} width={200}/>
        </Link>

        <QuickSelectMenu />

        <SiteSearchOverlay />

        <button
          type="button"
          onClick={toggleCurrency}
          className="relative hidden h-12 w-[132px] items-center rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)] transition-colors duration-300 md:inline-flex"
          aria-label="Toggle currency"
        >
          <span className="absolute left-0 flex w-full items-center justify-between px-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--ms-body)] opacity-40">
            <span>$ USD</span>
            <span><FontAwesomeIcon icon={faEuroSign} /> EUR</span>
          </span>
          <span
            className={`relative z-10 flex h-[40px] w-[64px] items-center justify-center gap-1 rounded-full text-xs font-black text-white shadow-md transition-transform duration-300 ${
              currency === "EUR"
                ? "translate-x-[62px] bg-[var(--ms-gradient-end)]"
                : "translate-x-[3px] bg-[var(--ms-gradient-end)]"
            }`}
          >
            {currency === "EUR" ? <><FontAwesomeIcon icon={faEuroSign} /><span>EUR</span></> : <><FontAwesomeIcon icon={faDollarSign} /><span>USD</span></>}
          </span>
        </button>

        <div className="hidden xl:block">
          <ThemeToggle />
        </div>

        <nav className="ml-auto flex items-center gap-8 text-sm font-semibold text-[var(--ms-heading)] sm:gap-6">
          {/* Menu Games */}
          <Link className="group hidden flex-col items-center text-center text-xs transition-colors duration-200 hover:text-[var(--ms-gradient-end)] sm:flex" href="/games">
            <div className="flex h-10 w-10 items-center justify-center">
              <Gamepad2 aria-hidden="true" className="transition-colors duration-200 group-hover:text-[var(--ms-gradient-end)]" size={22} />
            </div>
            <span className="transition-colors duration-200 group-hover:text-[var(--ms-gradient-end)]">Games</span>
          </Link>

          {/* Menu Guide */}
          <Link className="group hidden flex-col items-center text-center text-xs transition-colors duration-200 hover:text-[var(--ms-gradient-end)] sm:flex" href="/guide">
            <div className="flex h-10 w-10 items-center justify-center">
              <BookOpen aria-hidden="true" className="transition-colors duration-200 group-hover:text-[var(--ms-gradient-end)]" size={22} />
            </div>
            <span className="transition-colors duration-200 group-hover:text-[var(--ms-gradient-end)]">Guide</span>
          </Link>

          {/* Menu Blog */}
          <Link className="group hidden flex-col items-center text-center text-xs transition-colors duration-200 hover:text-[var(--ms-gradient-end)] sm:flex" href="/blog">
            <div className="flex h-10 w-10 items-center justify-center">
              <Newspaper aria-hidden="true" className="transition-colors duration-200 group-hover:text-[var(--ms-gradient-end)]" size={22} />
            </div>
            <span className="transition-colors duration-200 group-hover:text-[var(--ms-gradient-end)]">Blog</span>
          </Link>

          {/* Menu Cart */}
          <Link aria-label="Cart" className="group flex flex-col items-center text-center text-xs transition-colors duration-200 hover:text-[var(--ms-gradient-end)]" href="/cart">
            <div className="flex h-10 w-10 items-center justify-center">
              <ShoppingCart aria-hidden="true" className="transition-colors duration-200 group-hover:text-[var(--ms-gradient-end)]" size={22} />
            </div>
            <span className="transition-colors duration-200 group-hover:text-[var(--ms-gradient-end)]">Cart</span>
          </Link>

          {/* Menu Notif */}
          {isLoggedIn ? (
            <div className="group hidden flex-col items-center text-center text-xs transition-colors duration-200 hover:text-[var(--ms-gradient-end)] sm:flex">
              <NotificationBell iconSize={22} label="Notifications" mode="customer" />
              <span className="mt-0.5 transition-colors duration-200 group-hover:text-[var(--ms-gradient-end)]">Notif</span>
            </div>
          ) : null}

          {/* Menu User / Login */}
          {loading ? (
            <div className="h-11 w-11 animate-pulse rounded bg-white/5" />
          ) : isLoggedIn ? (
            <Link aria-label="Profile" className="group flex flex-col items-center text-center text-xs transition-colors duration-200 hover:text-[var(--ms-gradient-end)]" href="/profile">
              <div className="flex h-10 w-10 items-center justify-center">
                <CircleUserRound aria-hidden="true" className="transition-colors duration-200 group-hover:text-[var(--ms-gradient-end)]" size={23} />
              </div>
              <span className="transition-colors duration-200 group-hover:text-[var(--ms-gradient-end)]">User</span>
            </Link>
          ) : (
            <Link className="ms-button h-11 px-3 mono text-xs uppercase tracking-[0.16em] md:px-4" href="/login">
              <LogIn aria-hidden="true" size={16} />
              <span className="hidden sm:inline">Login</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}


