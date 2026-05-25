import Link from "next/link";
import { GameCard } from "@/components/ui";
import type { GameCatalogItem } from "@/lib/catalog";

const topTitles = [
  { label: "All Games", slug: "all" },
  { label: "WoW", slug: "world-of-warcraft" },
  { label: "Destiny 2", slug: "destiny-2" },
  { label: "Valorant", slug: "valorant" },
  { label: "LoL", slug: "league-of-legends" },
];

const genres = ["Action RPG", "MMO", "Shooters", "MOBA"];
const initialVisibleCount = 6;

function matchesQuery(game: GameCatalogItem, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) return true;

  return [game.name, game.genre, game.genreGroup, game.platform, game.description].some((value) =>
    value.toLowerCase().includes(normalizedQuery),
  );
}

function gamesHref({
  genre,
  limit,
  query,
  title,
}: {
  genre: string[];
  limit?: number;
  query: string;
  title: string;
}) {
  const params = new URLSearchParams();

  if (title !== "all") params.set("title", title);
  if (genre.length > 0) params.set("genre", genre.join(","));
  if (query.trim()) params.set("q", query.trim());
  if (limit && limit !== initialVisibleCount) params.set("limit", String(limit));

  const queryString = params.toString();

  return queryString ? `/games?${queryString}` : "/games";
}

export function GamesCatalog({
  activeGenres,
  activeTitle,
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
  const filteredGames = games.filter((game) => {
    const titleMatch = activeTitle === "all" || game.slug === activeTitle;
    const genreMatch = activeGenres.length === 0 || activeGenres.includes(game.genreGroup);

    return titleMatch && genreMatch && matchesQuery(game, query);
  });
  const visibleGames = filteredGames.slice(0, visibleCount);

  return (
    <section className="ms-shell grid gap-8 py-16 lg:grid-cols-[260px_1fr]">
      <aside className="ms-card h-fit rounded-xl p-6 lg:sticky lg:top-32">
        <h2 className="mono text-sm font-bold uppercase tracking-[0.22em] text-[var(--ms-gradient-end)]">
          Top Titles
        </h2>
        <div className="mt-5 space-y-3">
          {topTitles.map((item) => (
            <Link
              key={item.slug}
              href={gamesHref({ genre: activeGenres, query, title: item.slug })}
              className={`block w-full rounded-md border px-4 py-3 text-left mono text-sm uppercase tracking-[0.14em] ${
                item.slug === activeTitle
                  ? "border-[var(--primary)] bg-[var(--ms-hover-bg)] text-[var(--ms-heading)]"
                  : "border-[var(--ms-border)] bg-[var(--ms-bg-card)] text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-heading)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <h2 className="mono mt-10 text-sm font-bold uppercase tracking-[0.22em] text-[var(--ms-gradient-end)]">
          Genres
        </h2>
        <div className="mt-5 flex flex-wrap gap-3">
          {genres.map((genre) => {
            const isActive = activeGenres.includes(genre);
            const nextGenres = isActive
              ? activeGenres.filter((activeGenre) => activeGenre !== genre)
              : [...activeGenres, genre];

            return (
              <Link
                key={genre}
                href={gamesHref({ genre: nextGenres, query, title: activeTitle })}
                aria-pressed={isActive}
                className={`rounded-full border px-4 py-2 mono text-xs uppercase tracking-[0.16em] ${
                  isActive
                    ? "border-[var(--primary)] bg-[var(--ms-hover-bg)] text-[var(--ms-heading)]"
                    : "border-[var(--ms-border)] bg-[var(--ms-bg-card)] text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)]"
                }`}
              >
                {genre}
              </Link>
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
          <form
            action="/games"
            className="flex h-12 w-full items-center rounded-md border border-[var(--ms-border)] bg-[var(--ms-bg-card)] px-4 text-[var(--ms-body)] md:w-96"
          >
            {activeTitle !== "all" ? <input type="hidden" name="title" value={activeTitle} /> : null}
            {activeGenres.length > 0 ? <input type="hidden" name="genre" value={activeGenres.join(",")} /> : null}
            <label htmlFor="games-search" className="sr-only">
              Search games
            </label>
            <input
              id="games-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Search games..."
              className="w-full bg-transparent mono text-sm outline-none"
            />
          </form>
        </div>

        <div className="mt-6 flex flex-col justify-between gap-3 text-sm text-[var(--ms-body)] md:flex-row md:items-center">
          <p>
            Showing <span className="mono text-[var(--ms-heading)]">{visibleGames.length}</span> of{" "}
            <span className="mono text-[var(--ms-heading)]">{filteredGames.length}</span> games
          </p>
          {query || activeGenres.length > 0 || activeTitle !== "all" ? (
            <Link href="/games" className="w-fit text-[var(--ms-gradient-end)] hover:underline">
              Clear filters
            </Link>
          ) : null}
        </div>

        {visibleGames.length > 0 ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleGames.map((game) => (
              <GameCard
                key={game.slug}
                description={game.description}
                genre={game.genre}
                name={game.name}
                platform={game.platform}
              />
            ))}
          </div>
        ) : (
          <div className="ms-card mt-8 rounded-xl p-10 text-center">
            <h2 className="text-2xl font-black">No games found</h2>
            <p className="mt-3 text-[var(--ms-body)]">Try another title, genre, or search term.</p>
          </div>
        )}

        {visibleCount < filteredGames.length ? (
          <div className="mt-10 flex justify-center">
            <Link
              href={gamesHref({
                genre: activeGenres,
                limit: visibleCount + 6,
                query,
                title: activeTitle,
              })}
              className="ms-button h-12 px-8 mono text-sm uppercase tracking-[0.18em]"
            >
              Load More
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
