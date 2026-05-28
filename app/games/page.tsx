import { GamesCatalog } from "@/components/games-catalog";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { supportedGames } from "@/lib/catalog";

type GamesPageProps = {
  searchParams?: Promise<{
    genre?: string;
    limit?: string;
    q?: string;
    title?: string;
  }>;
};

const titleSlugs = ["all", "world-of-warcraft", "destiny-2", "valorant", "league-of-legends"];
const genreGroups = ["Action RPG", "MMO", "Shooters", "MOBA"];

function getActiveTitle(value: string | undefined) {
  if (value && titleSlugs.includes(value)) {
    return value;
  }

  return "all";
}

function getActiveGenres(value: string | undefined) {
  if (!value) return [];

  return value
    .split(",")
    .map((genre) => genre.trim())
    .filter((genre) => genreGroups.includes(genre));
}

function getVisibleCount(value: string | undefined) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 6;
}

export default async function GamesPage({ searchParams }: GamesPageProps) {
  const params = await searchParams;
  const activeTitle = getActiveTitle(params?.title);
  const activeGenres = getActiveGenres(params?.genre);
  const query = params?.q ?? "";
  const visibleCount = getVisibleCount(params?.limit);

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />
      <GamesCatalog
        activeGenres={activeGenres}
        activeTitle={activeTitle}
        games={supportedGames}
        query={query}
        visibleCount={visibleCount}
      />
      <SiteFooter />
    </main>
  );
}
