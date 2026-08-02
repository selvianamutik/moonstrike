"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogIn, ShoppingCart, Gamepad2, CircleUserRound, BookOpen, Newspaper, X, Menu, ChevronLeft, ChevronRight } from "lucide-react";
import { CartCountBadge } from "@/components/cart-count-badge";
import { NotificationBell } from "@/components/notification-bell";
import { QuickSelectMenu } from "@/components/quick-select-menu";
import { SiteSearchOverlay } from "@/components/site-search-overlay";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDollarSign, faEuroSign } from "@fortawesome/free-solid-svg-icons";
import { useQuickSelectCatalog, useQuickSelectFilter } from "@/hooks/useQuickSelectCatalog";

const mobileNavLinks = [
  { href: "/games", icon: Gamepad2, label: "Games" },
  { href: "/guide", icon: BookOpen, label: "Guide" },
  { href: "/blog", icon: Newspaper, label: "Blog" },
];

function MobileQuickSelectPanel({ onClose, onBack }: { onClose: () => void; onBack: () => void }) {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const { catalog, isLoadingCatalog } = useQuickSelectCatalog(true);
  const { filteredGames, serviceColumns, debouncedQuery } = useQuickSelectFilter(catalog, query, activeGame);

  // Auto-select first game after catalog loads
  useEffect(() => {
    if (catalog.games.length > 0 && !activeGame) {
      setActiveGame(catalog.games[0].slug);
    }
  }, [catalog.games, activeGame]);

  // Auto-focus first filtered game when search query changes
  useEffect(() => {
    if (debouncedQuery && filteredGames.length > 0) {
      setActiveGame(filteredGames[0].slug);
    }
  }, [debouncedQuery, filteredGames]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--ms-border)] text-[var(--ms-body)] hover:text-[var(--ms-heading)]"
          aria-label="Back to menu"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-bold text-[var(--ms-heading)]">Choose Game</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-md border border-[var(--ms-border)] text-[var(--ms-body)] hover:text-[var(--ms-heading)]"
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      {/* Search */}
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search games or services..."
        className="mb-3 w-full rounded-lg border border-[var(--ms-border)] bg-[var(--ms-field)] px-3 py-2 mono text-xs outline-none text-[var(--ms-heading)] placeholder:text-[var(--ms-body)]"
        autoFocus
      />

      {/* Game list */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {isLoadingCatalog ? (
          <>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-7 w-20 animate-pulse rounded-md bg-[var(--ms-border)]" />
            ))}
          </>
        ) : filteredGames.length === 0 ? (
          <p className="text-xs text-[var(--ms-body)]">No games found</p>
        ) : (
          filteredGames.map((g) => (
            <button
              key={g.slug}
              type="button"
              onClick={() => setActiveGame(g.slug)}
              className={`qs-game-btn rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                activeGame === g.slug ? "qs-game-btn--active" : "qs-game-btn--idle"
              }`}
            >
              {g.name}
            </button>
          ))
        )}
      </div>

      {/* Services */}
      <div className="flex-1 overflow-y-auto">
        {!activeGame ? (
          <p className="text-xs text-[var(--ms-body)] py-2">Select a game above to see services</p>
        ) : serviceColumns.length === 0 ? (
          <p className="text-xs text-[var(--ms-body)] py-2">
            {debouncedQuery.trim()
              ? `No services match "${debouncedQuery.trim()}"`
              : "No services available for this game"}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {serviceColumns.map(([category, services]) => {
              const categorySlug = services[0]?.serviceCategorySlug;
              const targetHref = categorySlug ? `/${activeGame}/${categorySlug}` : `/${activeGame}`;

              return (
                <div key={category} className="flex flex-col gap-1">
                  <Link
                    href={targetHref}
                    onClick={onClose}
                    className="qs-category-link group flex items-center gap-2"
                  >
                    <span className="qs-bullet h-1.5 w-1.5 shrink-0 rounded-full" />
                    <h3 className="qs-category-label text-xs font-semibold transition-colors">{category}</h3>
                    <ChevronRight size={12} className="ml-auto text-[var(--ms-body)]" />
                  </Link>
                  <div className="ml-3 flex flex-col gap-0.5">
                    {services.map((s) => {
                      const serviceHref = categorySlug
                        ? `/${activeGame}/${categorySlug}/${s.slug}`
                        : `/${activeGame}/${s.slug}`;
                      return (
                        <Link
                          key={s.slug}
                          href={serviceHref}
                          onClick={onClose}
                          className="qs-service-link text-xs underline-offset-2 transition-colors hover:underline"
                        >
                          {s.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function SiteHeader() {
  const { user, loading } = useAuth();
  const { currency, toggleCurrency } = useCurrency();
  const isLoggedIn = Boolean(user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [drawerView, setDrawerView] = useState<"menu" | "quickselect">("menu");

  function openDrawer() {
    setDrawerView("menu");
    setMobileMenuOpen(true);
  }

  function closeDrawer() {
    setMobileMenuOpen(false);
    setDrawerView("menu");
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--ms-border)] bg-[var(--ms-bg-navbar)]/95 backdrop-blur">
        <div className="top-nav-user flex min-h-16 items-center gap-3 py-0 sm:min-h-20 sm:gap-6 md:min-h-24 md:gap-12">
          <Link href="/" className="font-display shrink-0 text-2xl font-black tracking-[-0.03em] sm:text-3xl">
            <img src={'/logo/logo.png'} width={120} className="sm:w-[150px] md:w-[180px]" alt="MoonStrike" />
          </Link>

          <QuickSelectMenu />

          <SiteSearchOverlay />

          {/* Currency toggle — desktop only */}
          <button
            type="button"
            onClick={toggleCurrency}
            className="relative hidden h-12 w-[132px] items-center rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)] transition-colors duration-300 lg:inline-flex"
            aria-label="Toggle currency"
          >
            <span className="absolute left-0 flex w-full items-center justify-between px-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--ms-body)] opacity-40">
              <span>$ USD</span>
              <span>€ EUR</span>
            </span>
            <span
              className={`absolute flex h-9 w-[60px] items-center justify-center gap-1.5 rounded-full bg-[var(--primary)] text-xs font-black uppercase tracking-[0.08em] text-white shadow transition-all duration-300 ${
                currency === "EUR" ? "left-[68px]" : "left-1"
              }`}
            >
              <FontAwesomeIcon icon={currency === "EUR" ? faEuroSign : faDollarSign} className="h-3 w-3" />
              {currency}
            </span>
          </button>

          {/* Theme toggle — desktop only, next to currency */}
          <div className="hidden lg:flex">
            <ThemeToggle />
          </div>

          <nav className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Desktop nav links */}
            <div className="hidden items-center gap-1 lg:flex">
              {mobileNavLinks.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 rounded-md flex-col px-3 py-2 text-sm font-semibold text-[var(--ms-body)] hover:bg-[var(--ms-hover-bg)] hover:text-[var(--ms-heading)]"
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
            </div>

            {/* Cart — desktop only */}
            <div className="hidden lg:flex">
              <Link href="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-md border border-[var(--ms-border)] text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-heading)]">
                <ShoppingCart size={18} />
                <CartCountBadge />
              </Link>
            </div>

            {/* Notification bell — logged in only, desktop */}
            {isLoggedIn && !loading && (
              <div className="hidden lg:flex">
                <NotificationBell mode="customer" />
              </div>
            )}

            {/* Profile / Login — desktop */}
            {!loading && (
              <div className="hidden lg:flex">
                {isLoggedIn ? (
                  <Link href="/profile" className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--ms-border)] text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-heading)]">
                    <CircleUserRound size={18} />
                  </Link>
                ) : (
                  <Link href="/login" className="ms-button h-10 inline-flex items-center gap-2 px-4 mono text-xs uppercase tracking-[0.16em]">
                    <LogIn size={16} />
                    Login
                  </Link>
                )}
              </div>
            )}

            {/* Hamburger — mobile only */}
            <button
              type="button"
              aria-label="Open menu"
              onClick={openDrawer}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--ms-border)] lg:hidden"
            >
              <Menu size={20} />
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeDrawer}
          />
          {/* Drawer */}
          <div className="relative ml-auto flex h-full w-72 max-w-[85vw] flex-col bg-[var(--ms-bg-card)] p-6 shadow-2xl overflow-hidden">

            {/* VIEW: main menu */}
            {drawerView === "menu" && (
              <>
                <div className="mb-8 flex items-center justify-between">
                  <img src={'/logo/logo.png'} width={120} alt="MoonStrike" />
                  <button
                    type="button"
                    aria-label="Close menu"
                    onClick={closeDrawer}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--ms-border)] text-[var(--ms-body)] hover:text-[var(--ms-heading)]"
                  >
                    <X size={18} />
                  </button>
                </div>

                <nav className="flex flex-col gap-1">
                  {/* Choose Game — opens quick select inline */}
                  <button
                    type="button"
                    onClick={() => setDrawerView("quickselect")}
                    className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-semibold text-[var(--ms-heading)] hover:bg-[var(--ms-hover-bg)] hover:text-[var(--ms-gradient-end)]"
                  >
                    <div className="flex items-center gap-3">
                      <Menu size={18} />
                      Choose Game
                    </div>
                    <ChevronRight size={16} className="text-[var(--ms-body)]" />
                  </button>

                  {mobileNavLinks.map(({ href, icon: Icon, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={closeDrawer}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-[var(--ms-heading)] hover:bg-[var(--ms-hover-bg)] hover:text-[var(--ms-gradient-end)]"
                    >
                      <Icon size={18} />
                      {label}
                    </Link>
                  ))}

                  {/* Notif */}
                  {isLoggedIn && (
                    <Link
                      href="/notifications"
                      onClick={closeDrawer}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-[var(--ms-heading)] hover:bg-[var(--ms-hover-bg)] hover:text-[var(--ms-gradient-end)]"
                    >
                      <NotificationBell iconSize={18} mode="customer" />
                      Notifications
                    </Link>
                  )}
                </nav>

                <div className="mt-6 border-t border-[var(--ms-border)] pt-6 flex flex-col gap-3">
                  {/* Currency toggle mobile */}
                  <button
                    type="button"
                    onClick={toggleCurrency}
                    className="flex items-center justify-between rounded-lg border border-[var(--ms-border)] px-4 py-3 text-sm font-bold text-[var(--ms-heading)] hover:bg-[var(--ms-hover-bg)]"
                  >
                    <span>Currency</span>
                    <span className="mono text-xs font-black text-[var(--ms-gradient-end)]">
                      {currency === "EUR" ? "€ EUR" : "$ USD"}
                    </span>
                  </button>

                  <ThemeToggle />
                </div>

                <div className="mt-auto border-t border-[var(--ms-border)] pt-6">
                  {isLoggedIn ? (
                    <Link
                      href="/profile"
                      onClick={closeDrawer}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-[var(--ms-heading)] hover:bg-[var(--ms-hover-bg)]"
                    >
                      <CircleUserRound size={18} />
                      My Account
                    </Link>
                  ) : (
                    <Link
                      href="/login"
                      onClick={closeDrawer}
                      className="ms-button w-full justify-center py-3 mono text-xs uppercase tracking-[0.16em]"
                    >
                      <LogIn size={16} />
                      Login
                    </Link>
                  )}
                </div>
              </>
            )}

            {/* VIEW: quick select game inline */}
            {drawerView === "quickselect" && (
              <MobileQuickSelectPanel
                onClose={closeDrawer}
                onBack={() => setDrawerView("menu")}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
