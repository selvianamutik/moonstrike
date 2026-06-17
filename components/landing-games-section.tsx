"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { GameCard } from "@/components/ui";
import type { GameCatalogItem } from "@/lib/catalog";
import { ScrollingTabList } from "./scrolling-tab-list";

const INITIAL_GAME_COUNT = 4;
const GAME_INCREMENT = 4;

export function LandingGamesSection({ games }: { games: GameCatalogItem[] }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_GAME_COUNT);
  const [activeGame, setActiveGame] = useState("all");

  const visibleGames = useMemo(() => {
    const filtered = activeGame === "all" 
      ? games 
      : games.filter((g) => g.genre === activeGame);
    return filtered.slice(0, visibleCount);
  }, [games, visibleCount, activeGame]);
  const canLoadMore = visibleCount < (activeGame === "all" ? games.length : games.filter((g) => g.genre === activeGame).length);

  const genres = useMemo(
    () => Array.from(new Set(games.map((g) => g.genre))).sort((a, b) => a.localeCompare(b)),
    [games]
  );

  const genreTabs = useMemo(
    () => [
      { key: "all", label: "All", onClick: () => setActiveGame("all") },
      ...genres.map((g) => ({
        key: g,
        label: g,
        onClick: () => setActiveGame(g),
      })),
    ],
    [genres]
  );

  return (
    <section className="ms-shell py-14">
      <div className="flex items-end justify-between gap-6 mb-6">
        <h2 className="font-display text-3xl font-black tracking-[-0.04em]">
          All <span className="section-accent">Games</span>
        </h2>
        <Link
          href="/games"
          className="mono text-sm uppercase tracking-[0.3em] text-[var(--ms-gradient-end)]"
        >
          View all
        </Link>
      </div>

      <ScrollingTabList
        activeKey={activeGame}
        ariaLabel="Filter by genre"
        fixedTabs={[]}
        scrollingTabs={genreTabs}
      />

      <div className="mt-12 grid auto-rows-fr gap-8 md:grid-cols-2 xl:grid-cols-4">
        {visibleGames.map((game) => (
          <GameCard
            key={game.slug}
            {...game}
            href={`/${game.slug}`}
          />
        ))}
      </div>

      {canLoadMore && (
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + GAME_INCREMENT)}
            className="inline-flex rounded-md bg-[var(--ms-bg-card)] px-8 py-4 font-bold text-[var(--ms-heading)] hover:bg-[var(--ms-hover-bg)]"
          >
            Load More Games
          </button>
        </div>
      )}
    </section>
  );
}
