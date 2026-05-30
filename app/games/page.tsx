import { GamesCatalog } from "@/components/games-catalog";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { listActiveCatalogGames } from "@/lib/cms/games";

type GamesPageProps = {
  searchParams?: Promise<{
    genre?: string;
    limit?: string;
    q?: string;
    title?: string;
  }>;
};

function getActiveGenres(value: string | undefined, availableGenres: string[]) {
  if (!value) return [];

  const availableGenreSet = new Set(availableGenres);

  return value
    .split(",")
    .map((genre) => genre.trim())
    .filter((genre) => availableGenreSet.has(genre));
}

function getVisibleCount(value: string | undefined) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 6;
}

export default async function GamesPage({ searchParams }: GamesPageProps) {
  const params = await searchParams;
  const games = await listActiveCatalogGames();
  const genres = Array.from(new Set(games.map((game) => game.genre))).sort((a, b) => a.localeCompare(b));
  const activeGenres = getActiveGenres(params?.genre, genres);
  const query = params?.q ?? "";
  const visibleCount = getVisibleCount(params?.limit);

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />
      <GamesCatalog
        activeGenres={activeGenres}
        activeTitle="all"
        games={games}
        query={query}
        visibleCount={visibleCount}
      />
      <SiteFooter />
    </main>
  );
}
