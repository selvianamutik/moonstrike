"use client";

import React, { useMemo, useState } from "react";
import { GameCard } from "@/components/ui";
import type { GameCatalogItem } from "@/lib/catalog";

const initialVisibleCount = 6;
const visibleIncrement = 6;

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
  visibleCount,
}: {
  activeGenres: string[];
  activeTitle: string;
  games: GameCatalogItem[];
  query: string;
  visibleCount: number;
}) {
  const [selectedGenres, setSelectedGenres] = useState(activeGenres);
  const [search, setSearch] = useState(query);
  const [visible, setVisible] = useState(visibleCount);
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
  const visibleGames = filteredGames.slice(0, visible);

  function toggleGenre(genre: string) {
    setVisible(initialVisibleCount);
    setSelectedGenres((current) =>
      current.includes(genre)
        ? current.filter((activeGenre) => activeGenre !== genre)
        : [...current, genre]
    );
  }

  function clearFilters() {
    setSelectedGenres([]);
    setSearch("");
    setVisible(initialVisibleCount);
  }

  return (
    <section className="ms-shell grid gap-8 py-16 lg:grid-cols-[260px_1fr]">
      <aside className="ms-card h-fit rounded-xl p-6 lg:sticky lg:top-32">
        <h2 className="mono text-sm font-bold uppercase tracking-[0.22em] text-[var(--ms-gradient-end)]">
          Genres
        </h2>
        <div className="mt-5 flex flex-wrap gap-3">
          {genres.map((genre) => {
            const isActive = selectedGenres.includes(genre);

            return (
              <button
                key={genre}
                type="button"
                onClick={() => toggleGenre(genre)}
                aria-pressed={isActive}
                className={`rounded-full border px-4 py-2 mono text-xs uppercase tracking-[0.16em] ${
                  isActive
                    ? "border-[var(--primary)] bg-[var(--ms-hover-bg)] text-[var(--ms-heading)]"
                    : "border-[var(--ms-border)] bg-[var(--ms-bg-card)] text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)]"
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </aside>

      <div>
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mono text-xs uppercase tracking-[0.24em] text-[var(--ms-gradient-end)]">Games Library</p>
            <h1 className="font-display mt-3 text-3xl font-black tracking-[-0.04em]">All games</h1>
          </div>
          <div className="flex h-12 w-full items-center rounded-md border border-[var(--ms-border)] bg-[var(--ms-bg-card)] px-4 text-[var(--ms-body)] md:w-96">
            <label htmlFor="games-search" className="sr-only">
              Search games
            </label>
            <input
              id="games-search"
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setVisible(initialVisibleCount);
              }}
              placeholder="Search games..."
              className="w-full bg-transparent mono text-sm outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col justify-between gap-3 text-sm text-[var(--ms-body)] md:flex-row md:items-center">
          <p>
            Showing <span className="mono text-[var(--ms-heading)]">{visibleGames.length}</span> of{" "}
            <span className="mono text-[var(--ms-heading)]">{filteredGames.length}</span> games
          </p>
          {search || selectedGenres.length > 0 ? (
            <button type="button" onClick={clearFilters} className="w-fit text-[var(--ms-gradient-end)] hover:underline">
              Clear filters
            </button>
          ) : null}
        </div>

        {visibleGames.length > 0 ? (
          <div className="mt-8 grid auto-rows-fr gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleGames.map((game) => (
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

        {visible < filteredGames.length ? (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => setVisible((current) => current + visibleIncrement)}
              className="ms-button h-12 px-8 mono text-sm uppercase tracking-[0.18em]"
            >
              Load More
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
