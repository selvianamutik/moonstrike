"use client";

import { useEffect, useMemo, useState } from "react";
import { type GameCatalogItem, type GameService } from "@/lib/catalog";
import { useDebounce } from "@/hooks/useDebounce";

export type QuickSelectCatalog = {
  games: GameCatalogItem[];
  services: GameService[];
};

// Module-level catalog cache — fetched once per session, shared across all uses
let catalogCache: QuickSelectCatalog | null = null;

export function useQuickSelectCatalog(isActive: boolean) {
  const [catalog, setCatalog] = useState<QuickSelectCatalog>(
    catalogCache ?? { games: [], services: [] }
  );
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [hasLoadedCatalog, setHasLoadedCatalog] = useState(catalogCache !== null);

  useEffect(() => {
    if (!isActive || hasLoadedCatalog) return;
    let isMounted = true;
    setIsLoadingCatalog(true);
    fetch("/api/catalog/quick-select")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: QuickSelectCatalog) => {
        if (isMounted) {
          const loaded: QuickSelectCatalog = {
            games: Array.isArray(data.games) ? data.games : [],
            services: Array.isArray(data.services) ? data.services : [],
          };
          catalogCache = loaded;
          setCatalog(loaded);
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
  }, [hasLoadedCatalog, isActive]);

  return { catalog, isLoadingCatalog };
}

export function useQuickSelectFilter(
  catalog: QuickSelectCatalog,
  query: string,
  activeGame: string | null,
) {
  const debouncedQuery = useDebounce(query, 180);

  const filteredGames = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return catalog.games;
    return catalog.games.filter((g) =>
      g.name.toLowerCase().includes(q) ||
      (g.genre ?? "").toLowerCase().includes(q)
    );
  }, [catalog.games, debouncedQuery]);

  const filteredServices = useMemo(() => {
    if (!activeGame) return [];
    const q = debouncedQuery.trim().toLowerCase();
    return catalog.services.filter((s) => {
      const matchGame = activeGame === "all" || s.gameSlug === activeGame;
      const matchQ = !q || [s.name, s.offerTitle, s.gameName, s.serviceCategory, s.description, ...s.tags]
        .some((v) => (v ?? "").toLowerCase().includes(q));
      return matchGame && matchQ;
    });
  }, [activeGame, catalog.services, debouncedQuery]);

  const serviceColumns = useMemo(() => {
    const groups = new Map<string, typeof filteredServices>();
    filteredServices.forEach((s) => {
      const arr = groups.get(s.serviceCategory) ?? [];
      groups.set(s.serviceCategory, [...arr, s]);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredServices]);

  return { filteredGames, serviceColumns, debouncedQuery };
}
