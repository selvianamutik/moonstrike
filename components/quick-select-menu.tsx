"use client";

import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { getServiceDetailHref, type GameCatalogItem, type GameService } from "@/lib/catalog";

type QuickSelectCatalog = {
  games: GameCatalogItem[];
  services: GameService[];
};

const GAMES_PER_PAGE = 4;
const ANIM_DURATION = 240;

export function QuickSelectMenu() {
  const [activeGame, setActiveGame] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<QuickSelectCatalog>({ games: [], services: [] });
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [hasLoadedCatalog, setHasLoadedCatalog] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [gameStartIndex, setGameStartIndex] = useState(0);
  const [displayedGameIndex, setDisplayedGameIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const [phase, setPhase] = useState<"idle" | "exit" | "enter">("idle");
  const animatingRef = useRef(false);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || hasLoadedCatalog) return;

    let isMounted = true;
    setIsLoadingCatalog(true);

    fetch("/api/catalog/quick-select")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Unable to load catalog."))))
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

    return () => {
      isMounted = false;
    };
  }, [hasLoadedCatalog, isOpen]);

  const filteredServices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return catalog.services.filter((service) => {
      const matchesGame = activeGame === "all" || service.gameSlug === activeGame;
      const matchesQuery =
        !normalizedQuery ||
        [
          service.name,
          service.offerTitle,
          service.gameName,
          service.serviceCategory,
          service.description,
          ...service.tags,
        ].some((value) => (value ?? "").toLowerCase().includes(normalizedQuery));

      return matchesGame && matchesQuery;
    });
  }, [activeGame, catalog.services, query]);

  const serviceColumns = useMemo(() => {
    const groups = new Map<string, typeof filteredServices>();

    filteredServices.forEach((service) => {
      const services = groups.get(service.serviceCategory) ?? [];
      groups.set(service.serviceCategory, [...services, service]);
    });

    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredServices]);

  const canScrollGames = catalog.games.length > 1;
  const visibleGames =
    catalog.games.length > 0
      ? Array.from({ length: Math.min(GAMES_PER_PAGE, catalog.games.length) }, (_, index) => {
          return catalog.games[(displayedGameIndex + index) % catalog.games.length];
        })
      : [];

  function navigateGames(nextDirection: "next" | "previous") {
    if (animatingRef.current || !canScrollGames) return;
    animatingRef.current = true;

    const nextIndex =
      nextDirection === "next"
        ? (gameStartIndex + 1) % catalog.games.length
        : gameStartIndex <= 0
        ? catalog.games.length - 1
        : gameStartIndex - 1;

    setDirection(nextDirection);
    setGameStartIndex(nextIndex);
    setPhase("exit");
  }

  useEffect(() => {
    if (phase === "exit") {
      const timeoutId = window.setTimeout(() => {
        setDisplayedGameIndex(gameStartIndex);
        setPhase("enter");
      }, ANIM_DURATION);
      return () => window.clearTimeout(timeoutId);
    }

    if (phase === "enter") {
      const timeoutId = window.setTimeout(() => {
        setPhase("idle");
        animatingRef.current = false;
      }, ANIM_DURATION);
      return () => window.clearTimeout(timeoutId);
    }
  }, [gameStartIndex, phase]);

  const gameStripClass = (() => {
    if (phase === "exit") return direction === "next" ? "ms-genre-exit-next" : "ms-genre-exit-previous";
    if (phase === "enter") return direction === "next" ? "ms-genre-enter-next" : "ms-genre-enter-previous";
    return "";
  })();

  return (
    <>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="quick-select-overlay"
        onClick={() => setIsOpen((value) => !value)}
        className="ms-focus-ring h-12 w-12 shrink-0 rounded-md border border-[var(--ms-border)] bg-[var(--ms-bg-card)] hover:border-[var(--ms-gradient-end)]"
      >
        <Image src="/assets/bar-menu.png" alt="Open quick select" width={26} height={26} className="mx-auto" />
      </button>

      {isOpen && portalTarget ? createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-hidden bg-black/65 p-4 backdrop-blur-sm sm:p-6"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <section
            id="quick-select-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Quick service select"
            className="flex max-h-[calc(100vh-3rem)] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-[var(--ms-gradient-end)] bg-[var(--ms-bg-card)] p-5 text-[var(--ms-heading)] shadow-[0_0_0_1px_rgba(34,211,238,0.45),0_28px_90px_rgba(0,0,0,0.55)]"
          >
            <form
              action="/services"
              className="mx-auto flex h-12 max-w-xl items-center rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] pl-5 text-[var(--ms-body)]"
            >
              <label htmlFor="quick-select-search" className="sr-only">
                Search game or service
              </label>
              <input
                id="quick-select-search"
                name="q"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Game or Service"
                className="w-full bg-transparent mono text-sm tracking-[0.08em] outline-none"
              />
              <button className="ms-button ml-auto h-11 w-12 rounded-md" type="submit" aria-label="Search">
                <Image src="/assets/magnifien.png" alt="" width={22} height={22} />
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-3 border-t border-[var(--ms-border)] pt-7">
              <button
                type="button"
                onClick={() => setActiveGame("all")}
                className={`inline-flex h-10 shrink-0 items-center justify-center rounded-full px-5 mono text-xs uppercase tracking-[0.16em] ${
                  activeGame === "all"
                    ? "ms-button"
                    : "border border-[var(--ms-border)] bg-[var(--ms-bg-card)] text-[var(--ms-heading)] hover:border-[var(--ms-gradient-end)] hover:bg-[var(--ms-hover-bg)]"
                }`}
              >
                All
              </button>
              <button
                type="button"
                aria-label="Previous games"
                disabled={!canScrollGames}
                onClick={() => navigateGames("previous")}
                className="h-10 w-10 shrink-0 rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)] text-xl text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                &lt;
              </button>
              <div
                className="relative h-10 min-w-0 flex-1"
                style={{
                  maxWidth: 560,
                  overflow: "hidden",
                  WebkitMaskImage:
                    "linear-gradient(to right, transparent 0px, black 20px, black calc(100% - 20px), transparent 100%)",
                  maskImage:
                    "linear-gradient(to right, transparent 0px, black 20px, black calc(100% - 20px), transparent 100%)",
                }}
              >
                <div className={`absolute inset-0 flex items-center justify-center gap-3 ${gameStripClass}`}>
                  {visibleGames.map((game, index) => (
                    <button
                      key={`${game.slug}-${displayedGameIndex}-${index}`}
                      type="button"
                      onClick={() => setActiveGame(game.slug)}
                      className={`inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-5 mono text-xs uppercase tracking-[0.16em] ${
                        activeGame === game.slug
                          ? "ms-button"
                          : "border border-[var(--ms-border)] bg-[var(--ms-bg-card)] text-[var(--ms-heading)] hover:border-[var(--ms-gradient-end)] hover:bg-[var(--ms-hover-bg)]"
                      }`}
                    >
                      {game.name}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                aria-label="Next games"
                disabled={!canScrollGames}
                onClick={() => navigateGames("next")}
                className="h-10 w-10 shrink-0 rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)] text-xl text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                &gt;
              </button>
            </div>

            {isLoadingCatalog ? (
              <div className="min-h-0 flex-1 px-2 py-12 text-center text-sm text-[var(--ms-body)]">
                Loading services...
              </div>
            ) : serviceColumns.length > 0 ? (
              <div className="mt-8 grid min-h-0 flex-1 gap-x-12 gap-y-10 overflow-y-auto px-2 pb-8 pr-3 sm:grid-cols-2 lg:grid-cols-4">
                {serviceColumns.map(([category, services]) => (
                  <div key={category}>
                    <h3 className="mono border-b border-[var(--ms-border)] pb-2 text-xl font-bold uppercase tracking-[0.08em] text-[var(--ms-heading)]">
                      {category}
                    </h3>
                    <ul className="mt-4 space-y-3 text-sm text-[var(--ms-body)]">
                      {services.map((service) => (
                        <li key={`${service.gameSlug}-${service.slug}`}>
                          <Link
                            href={getServiceDetailHref(service)}
                            onClick={() => setIsOpen(false)}
                            className="hover:text-[var(--ms-gradient-end)]"
                          >
                            {activeGame === "all" ? `${service.gameName} - ${service.name}` : service.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="min-h-0 flex-1 px-2 py-12 text-center text-sm text-[var(--ms-body)]">
                No services found for {query}.
              </div>
            )}
          </section>
        </div>,
        portalTarget,
      ) : null}
    </>
  );
}
