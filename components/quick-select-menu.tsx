"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { type GameCatalogItem, type GameService } from "@/lib/catalog";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type QuickSelectCatalog = {
  games: GameCatalogItem[];
  services: GameService[];
};

const GAMES_PER_PAGE = 4;
const ANIM_DURATION = 240;

export function QuickSelectMenu() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<QuickSelectCatalog>({ games: [], services: [] });
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [hasLoadedCatalog, setHasLoadedCatalog] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

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

  useEffect(() => {
    if (!isOpen || hasLoadedCatalog) return;
    let isMounted = true;
    setIsLoadingCatalog(true);
    fetch("/api/catalog/quick-select")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: QuickSelectCatalog) => {
        if (isMounted) {
          setCatalog({
            games: Array.isArray(data.games) ? data.games : [],
            services: Array.isArray(data.services) ? data.services : [],
          });
          setHasLoadedCatalog(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCatalog({ games: [], services: [] });
          setHasLoadedCatalog(true);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingCatalog(false);
      });
    return () => { isMounted = false; };
  }, [hasLoadedCatalog, isOpen]);

  const filteredServices = useMemo(() => {
    if (!activeGame) return [];
    const q = query.trim().toLowerCase();
    return catalog.services.filter((s) => {
      const matchGame = activeGame === "all" || s.gameSlug === activeGame;
      const matchQ = !q || [s.name, s.offerTitle, s.gameName, s.serviceCategory, s.description, ...s.tags]
        .some((v) => (v ?? "").toLowerCase().includes(q));
      return matchGame && matchQ;
    });
  }, [activeGame, catalog.services, query]);

  const serviceColumns = useMemo(() => {
    const groups = new Map<string, typeof filteredServices>();
    filteredServices.forEach((s) => {
      const arr = groups.get(s.serviceCategory) ?? [];
      groups.set(s.serviceCategory, [...arr, s]);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredServices]);


  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="ms-button hidden h-11 shrink-0 items-center gap-2 px-4 mono text-xs uppercase tracking-[0.16em] lg:inline-flex"
      >
        <FontAwesomeIcon icon={faBars} />
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
                    X
                  </button>
                </div>

                <div className="flex min-h-[400px] flex-1 border-t border-[var(--ms-border)] overflow-hidden">
                  {/* SIDEBAR KIRI (Daftar Game) */}
                  <div className="w-[240px] shrink-0 border-r border-[var(--ms-border)] overflow-y-auto p-4 flex flex-col gap-1">
                    {catalog.games.map((g) => (
                      <button
                        key={g.slug}
                        onClick={() => setActiveGame(g.slug)}
                        className={`text-left px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                          activeGame === g.slug 
                            ? 'bg-[var(--ms-gradient-end)] text-white' 
                            : 'text-[var(--ms-body)] hover:bg-[var(--ms-hover-bg)] hover:text-white'
                        }`}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>

                  {/* PANEL KANAN (Daftar Kategori - Skycoach Style) */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {!activeGame ? (
                      <div className="flex h-full items-center justify-center text-[var(--ms-body)]">
                        <p className="text-sm">Select a game from the left menu to view categories</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {serviceColumns.map(([category, services]) => {
                          const categorySlug = services[0]?.serviceCategorySlug;
                          const targetHref = categorySlug
                            ? `/${activeGame}/${categorySlug}`
                            : `/${activeGame}`;

                          return (
                            <Link
                              key={category}
                              href={targetHref}
                              onClick={() => setIsOpen(false)}
                              className="group flex cursor-pointer items-center gap-3"
                            >
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ms-gradient-end)]"></span>
                              <h3 className="text-sm font-semibold text-white transition-colors group-hover:text-[var(--ms-gradient-end)]">{category}</h3>
                            </Link>
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