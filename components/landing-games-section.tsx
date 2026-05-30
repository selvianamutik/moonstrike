"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { GameCard } from "@/components/ui";
import type { GameCatalogItem } from "@/lib/catalog";

const INITIAL_GAME_COUNT = 4;
const GAME_INCREMENT = 4;
const GENRES_PER_PAGE = 4;
const ANIM_DURATION = 240;

function gamesGenreHref(genre: string) {
  const params = new URLSearchParams({ genre });
  return `/games?${params.toString()}`;
}

export function LandingGamesSection({ games }: { games: GameCatalogItem[] }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_GAME_COUNT);
  const [genreStartIndex, setGenreStartIndex] = useState(0);
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const [phase, setPhase] = useState<"idle" | "exit" | "enter">("idle");
  const animatingRef = useRef(false);

  const visibleGames = games.slice(0, visibleCount);
  const canLoadMore = visibleCount < games.length;

  const genres = useMemo(
    () => Array.from(new Set(games.map((g) => g.genre))).sort((a, b) => a.localeCompare(b)),
    [games]
  );

  const canScrollGenres = genres.length > 1;

  const genresForIndex = (startIdx: number) =>
    genres.length > 0
      ? Array.from({ length: GENRES_PER_PAGE }, (_, i) => genres[(startIdx + i) % genres.length])
      : [];

  const visibleGenres = genresForIndex(displayedIndex);

  function navigate(dir: "next" | "previous") {
    if (animatingRef.current || !canScrollGenres) return;
    animatingRef.current = true;

    const nextIndex =
      dir === "next"
        ? (genreStartIndex + 1) % genres.length
        : genreStartIndex <= 0
        ? genres.length - 1
        : genreStartIndex - 1;

    setDirection(dir);
    setGenreStartIndex(nextIndex);
    setPhase("exit");
  }

  useEffect(() => {
    if (phase === "exit") {
      const t = setTimeout(() => {
        setDisplayedIndex(genreStartIndex);
        setPhase("enter");
      }, ANIM_DURATION);
      return () => clearTimeout(t);
    }
    if (phase === "enter") {
      const t = setTimeout(() => {
        setPhase("idle");
        animatingRef.current = false;
      }, ANIM_DURATION);
      return () => clearTimeout(t);
    }
  }, [phase, genreStartIndex]);

  const stripClass = (() => {
    if (phase === "exit")
      return direction === "next" ? "ms-genre-exit-next" : "ms-genre-exit-previous";
    if (phase === "enter")
      return direction === "next" ? "ms-genre-enter-next" : "ms-genre-enter-previous";
    return "";
  })();

  return (
    <section className="ms-shell py-14">
      <div className="flex items-end justify-between gap-6">
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

      <div className="mt-10">
        <div className="flex items-center justify-center gap-3">
          {/* Static: All Games */}
          <Link
            href="/games"
            className="ms-button inline-flex h-10 shrink-0 items-center justify-center rounded-full px-5 mono text-xs uppercase tracking-[0.22em]"
          >
            All Games
          </Link>

          {/* Static: Prev */}
          <button
            type="button"
            aria-label="Previous genres"
            disabled={!canScrollGenres}
            onClick={() => navigate("previous")}
            className="h-10 w-10 shrink-0 rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)] text-xl text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            &lt;
          </button>

          {/* Clipping window */}
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
            <div className={`absolute inset-0 flex items-center justify-center gap-3 ${stripClass}`}>
              {visibleGenres.map((genre, index) => (
                <Link
                  key={`${genre}-${displayedIndex}-${index}`}
                  href={gamesGenreHref(genre)}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)] px-5 mono text-xs uppercase tracking-[0.22em] text-[var(--ms-heading)] whitespace-nowrap hover:border-[var(--ms-gradient-end)] hover:bg-[var(--ms-hover-bg)]"
                >
                  {genre}
                </Link>
              ))}
            </div>
          </div>

          {/* Static: Next */}
          <button
            type="button"
            aria-label="Next genres"
            disabled={!canScrollGenres}
            onClick={() => navigate("next")}
            className="h-10 w-10 shrink-0 rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)] text-xl text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            &gt;
          </button>
        </div>
      </div>

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
