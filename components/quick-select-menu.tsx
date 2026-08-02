"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQuickSelectCatalog, useQuickSelectFilter } from "@/hooks/useQuickSelectCatalog";

export function QuickSelectMenu({ forceOpen, onForceOpenConsumed }: { forceOpen?: boolean; onForceOpenConsumed?: () => void } = {}) {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  const { catalog, isLoadingCatalog } = useQuickSelectCatalog(isOpen);
  const { filteredGames, serviceColumns, debouncedQuery } = useQuickSelectFilter(catalog, query, activeGame);

  // Open dialog when forceOpen is triggered from parent (e.g. mobile drawer)
  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      onForceOpenConsumed?.();
    }
  }, [forceOpen, onForceOpenConsumed]);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

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
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="ms-button hidden h-11 shrink-0 items-center gap-2 px-4 mono text-xs uppercase tracking-[0.16em] lg:inline-flex"
      >
        <FontAwesomeIcon icon={faBars} />
        <span className="hidden md:block">Choose Game</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>

      {portalTarget && isOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-start justify-center pt-24"
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsOpen(false);
              }}
            >
              <div className="fixed inset-0 bg-black/60" />
              <section
                className="relative z-10 mx-4 flex max-h-[75vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] shadow-2xl"
                role="dialog"
                aria-modal="true"
                aria-label="Quick select game services"
              >
                <div className="flex items-center gap-4 border-b border-[var(--ms-border)] p-5">
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search games or services..."
                    className="flex-1 bg-transparent mono text-sm outline-none text-[var(--ms-heading)] placeholder:text-[var(--ms-body)]"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--ms-border)] text-[var(--ms-body)] hover:text-[var(--ms-heading)]"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex min-h-[400px] flex-1 border-t border-[var(--ms-border)] overflow-hidden">
                  {/* SIDEBAR KIRI (Daftar Game) */}
                  <div className="w-[240px] shrink-0 border-r border-[var(--ms-border)] overflow-y-auto p-4 flex flex-col gap-1">
                    {isLoadingCatalog ? (
                      <div className="space-y-2 p-2">
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className="h-9 w-full animate-pulse rounded-md bg-[var(--ms-border)]" />
                        ))}
                      </div>
                    ) : filteredGames.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-[var(--ms-body)]">No games found</p>
                    ) : (
                      filteredGames.map((g) => (
                        <button
                          key={g.slug}
                          onClick={() => setActiveGame(g.slug)}
                          className={`qs-game-btn text-left px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                            activeGame === g.slug
                              ? 'qs-game-btn--active'
                              : 'qs-game-btn--idle'
                          }`}
                        >
                          {g.name}
                        </button>
                      ))
                    )}
                  </div>

                  {/* PANEL KANAN (Daftar Kategori) */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {!activeGame ? (
                      <div className="flex h-full items-center justify-center text-[var(--ms-body)]">
                        <p className="text-sm">Select a game from the left menu to view categories</p>
                      </div>
                    ) : serviceColumns.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-[var(--ms-body)]">
                        <p className="text-sm">
                          {debouncedQuery.trim()
                            ? `No services match "${debouncedQuery.trim()}"`
                            : "No services available for this game"}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {serviceColumns.map(([category, services]) => {
                          const categorySlug = services[0]?.serviceCategorySlug;
                          const targetHref = categorySlug
                            ? `/${activeGame}/${categorySlug}`
                            : `/${activeGame}`;

                          return (
                            <div key={category} className="flex flex-col gap-1">
                              <Link
                                href={targetHref}
                                onClick={() => setIsOpen(false)}
                                className="qs-category-link group flex cursor-pointer items-center gap-3"
                              >
                                <span className="qs-bullet h-1.5 w-1.5 shrink-0 rounded-full"></span>
                                <h3 className="qs-category-label text-sm font-semibold transition-colors">{category}</h3>
                              </Link>
                              <div className="ml-4 flex flex-col gap-0.5">
                                {services.map((s) => {
                                  const serviceHref = categorySlug
                                    ? `/${activeGame}/${categorySlug}/${s.slug}`
                                    : `/${activeGame}/${s.slug}`;

                                  return (
                                    <Link
                                      key={s.slug}
                                      href={serviceHref}
                                      onClick={() => setIsOpen(false)}
                                      className="qs-service-link cursor-pointer text-xs underline-offset-2 transition-colors hover:underline"
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
              </section>
            </div>,
            portalTarget,
          ) : null}
    </>
  );
}
