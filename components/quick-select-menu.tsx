"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { ScrollingTabList, type ScrollingTabItem } from "@/components/scrolling-tab-list";
import { getServiceDetailHref, type GameCatalogItem, type GameService } from "@/lib/catalog";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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

  const gameTabs: ScrollingTabItem[] = [
    { key: "all", label: "All", onClick: () => setActiveGame("all") },
    ...catalog.games.map((g) => ({
      key: g.slug,
      label: g.name,
      onClick: () => setActiveGame(g.slug),
    })),
  ];

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

                <div className="mt-6 px-6">
                  <ScrollingTabList
                    activeKey={activeGame}
                    ariaLabel="Filter by game"
                    fixedTabs={[]}
                    scrollingTabs={gameTabs}
                  />
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