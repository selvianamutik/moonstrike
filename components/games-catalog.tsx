"use client";

import React, { useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { GameCard } from "@/components/ui";
import type { GameCatalogItem } from "@/lib/catalog";

function matchesQuery(game: GameCatalogItem, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  return [game.name, game.genre, game.genreGroup, game.platform, game.description].some((value) =>
    value.toLowerCase().includes(normalizedQuery),
  );
}

export function GamesCatalog({
  activeGenres,
  games,
  query,
}: {
  activeGenres: string[];
  activeTitle: string;
  games: GameCatalogItem[];
  query: string;
  visibleCount?: number;
}) {
  const [selectedGenres, setSelectedGenres] = useState(activeGenres);
  const [search, setSearch] = useState(query);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const genres = useMemo(
    () => Array.from(new Set(games.map((game) => game.genre))).sort((a, b) => a.localeCompare(b)),
    [games]
  );

  const filteredGames = useMemo(
    () =>
      games.filter((game) => {
        const genreMatch = selectedGenres.length === 0 || selectedGenres.includes(game.genre);
        return genreMatch && matchesQuery(game, search);
      }),
    [games, search, selectedGenres]
  );

  function toggleGenre(genre: string) {
    setSelectedGenres((current) =>
      current.includes(genre)
        ? current.filter((g) => g !== genre)
        : [...current, genre]
    );
  }

  function clearFilters() {
    setSelectedGenres([]);
    setSearch("");
  }

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const genreLabel = selectedGenres.length === 0
    ? "All Genres"
    : selectedGenres.length === 1
      ? selectedGenres[0]
      : `${selectedGenres.length} genres`;

  return (
    <section className="ms-shell py-16">
      <div>
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mono text-xs uppercase tracking-[0.24em] text-[var(--ms-gradient-end)]">Games Library</p>
            <h1 className="font-display mt-3 text-3xl font-black tracking-[-0.04em]">All games</h1>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 text-sm text-[var(--ms-body)] md:flex-row md:items-center md:justify-between">
          {/* Left: count + clear */}
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <p className="whitespace-nowrap">
              Showing <span className="mono text-[var(--ms-heading)]">{filteredGames.length}</span> games
            </p>
            {(search || selectedGenres.length > 0) ? (
              <button type="button" onClick={clearFilters} className="flex items-center gap-1 text-[var(--ms-gradient-end)] hover:underline">
                <X size={12} />
                Clear filters
              </button>
            ) : null}
          </div>

          {/* Right: Genre dropdown + Search */}
          <div className="flex w-full shrink-0 items-center gap-2 md:w-auto">
            {/* Genre dropdown */}
            <div ref={dropdownRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setDropdownOpen((o) => !o)}
                aria-expanded={dropdownOpen}
                aria-haspopup="listbox"
                className={`flex h-12 items-center gap-2 rounded-md border px-4 mono text-xs uppercase tracking-[0.14em] transition-colors ${
                  selectedGenres.length > 0
                    ? "border-[var(--primary)] bg-[var(--ms-hover-bg)] text-[var(--ms-heading)]"
                    : "border-[var(--ms-border)] bg-[var(--ms-bg-card)] text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)]"
                }`}
              >
                <span className="max-w-[120px] truncate">{genreLabel}</span>
                <ChevronDown
                  size={14}
                  className={`shrink-0 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>

              {dropdownOpen ? (
                <div
                  role="listbox"
                  aria-multiselectable="true"
                  aria-label="Filter by genre"
                  className="absolute left-0 top-[calc(100%+6px)] z-30 min-w-[180px] overflow-hidden rounded-lg border border-[var(--ms-border)] bg-[var(--ms-bg-card)] shadow-xl"
                >
                  {/* All option */}
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedGenres.length === 0}
                    onClick={() => { setSelectedGenres([]); setDropdownOpen(false); }}
                    className={`flex w-full items-center gap-2 border-b border-[var(--ms-border)] px-4 py-2.5 text-left mono text-xs uppercase tracking-[0.14em] transition-colors hover:bg-[var(--ms-hover-bg)] ${
                      selectedGenres.length === 0 ? "text-[var(--ms-gradient-end)]" : "text-[var(--ms-body)]"
                    }`}
                  >
                    {selectedGenres.length === 0 ? (
                      <span className="h-3 w-3 shrink-0 rounded-sm border border-[var(--ms-gradient-end)] bg-[var(--ms-gradient-end)]" />
                    ) : (
                      <span className="h-3 w-3 shrink-0 rounded-sm border border-[var(--ms-border)]" />
                    )}
                    All Genres
                  </button>

                  {genres.map((genre) => {
                    const isActive = selectedGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        onClick={() => toggleGenre(genre)}
                        className={`flex w-full items-center gap-2 px-4 py-2.5 text-left mono text-xs uppercase tracking-[0.14em] transition-colors hover:bg-[var(--ms-hover-bg)] ${
                          isActive ? "text-[var(--ms-gradient-end)]" : "text-[var(--ms-body)]"
                        }`}
                      >
                        {isActive ? (
                          <span className="h-3 w-3 shrink-0 rounded-sm border border-[var(--ms-gradient-end)] bg-[var(--ms-gradient-end)]" />
                        ) : (
                          <span className="h-3 w-3 shrink-0 rounded-sm border border-[var(--ms-border)]" />
                        )}
                        {genre}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {/* Search input */}
            <div className="flex h-12 flex-1 items-center rounded-md border border-[var(--ms-border)] bg-[var(--ms-bg-card)] px-4 text-[var(--ms-body)] md:w-64">
              <label htmlFor="games-search" className="sr-only">Search games</label>
              <input
                id="games-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search games..."
                className="w-full bg-transparent mono text-sm outline-none"
              />
            </div>
          </div>
        </div>

        {filteredGames.length > 0 ? (
          <div className="mt-8 grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredGames.map((game) => (
              <GameCard
                key={game.slug}
                description={game.description}
                genre={game.genre}
                href={`/${game.slug}`}
                image={game.image}
                name={game.name}
                platform={game.platform}
              />
            ))}
          </div>
        ) : (
          <div className="ms-card mt-8 rounded-xl p-10 text-center">
            <h2 className="text-2xl font-black">No games found</h2>
            <p className="mt-3 text-[var(--ms-body)]">Try another genre or search term.</p>
          </div>
        )}
      </div>
    </section>
  );
}
