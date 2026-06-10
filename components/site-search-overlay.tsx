"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { PlaceholderAsset } from "@/components/asset-image";

type SearchResult = {
  href: string;
  image: string;
  meta: string;
  title: string;
  type: "Game" | "Service";
};

type SearchPayload = {
  games?: SearchResult[];
  services?: SearchResult[];
};

function ResultRow({ result, onSelect }: { result: SearchResult; onSelect: () => void }) {
  return (
    <Link
      href={result.href}
      onClick={onSelect}
      className="grid grid-cols-[56px_1fr_auto] items-center gap-3 rounded-md border border-transparent p-2 hover:border-[var(--ms-border)] hover:bg-[var(--ms-hover-bg)]"
    >
      {result.image ? (
        <img src={result.image} alt="" className="h-14 w-14 rounded-md object-cover" />
      ) : (
        <PlaceholderAsset alt="" className="h-14 w-14 rounded-md" imageClassName="p-2" />
      )}
      <span className="min-w-0">
        <span className="block truncate text-sm font-black text-[var(--ms-heading)]">{result.title}</span>
        <span className="mt-1 block truncate text-xs text-[var(--ms-body)]">{result.meta}</span>
      </span>
      <span className="mono rounded border border-[var(--ms-border)] px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-[var(--ms-gradient-end)]">
        {result.type}
      </span>
    </Link>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-3 p-2">
      {[0, 1, 2].map((item) => (
        <div key={item} className="grid grid-cols-[56px_1fr_64px] items-center gap-3">
          <div className="h-14 w-14 animate-pulse rounded-md bg-white/10" />
          <div>
            <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
            <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-white/10" />
          </div>
          <div className="h-6 animate-pulse rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}

export function SiteSearchOverlay() {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchPayload>({ games: [], services: [] });

  const trimmedQuery = query.trim();
  const hasResults = Boolean(results.games?.length || results.services?.length);

  useEffect(() => {
    if (!isOpen || trimmedQuery.length < 2) {
      setResults({ games: [], services: [] });
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json().catch(() => ({}))) as SearchPayload;

        if (response.ok) {
          setResults({
            games: Array.isArray(payload.games) ? payload.games : [],
            services: Array.isArray(payload.services) ? payload.services : [],
          });
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResults({ games: [], services: [] });
        }
      } finally {
        setIsLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, trimmedQuery]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function closeOverlay() {
    setIsOpen(false);
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedQuery) return;
    closeOverlay();
    router.push(`/services?q=${encodeURIComponent(trimmedQuery)}`);
  }

  return (
    <div ref={wrapperRef} className="relative hidden flex-1 lg:block">
      <form
        onSubmit={submitSearch}
        className="flex h-12 items-center rounded-md border border-[var(--ms-border)] bg-[var(--ms-bg-card)] px-4 text-[var(--ms-body)]"
      >
        <label htmlFor="site-search" className="sr-only">
          Search games and services
        </label>
        <input
          id="site-search"
          name="q"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search games, services..."
          className="w-full bg-transparent mono text-sm outline-none"
          autoComplete="off"
        />
        <button type="submit" aria-label="Search" className="ms-focus-ring rounded p-1">
          <Search size={20} aria-hidden="true" />
        </button>
      </form>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-50 overflow-hidden rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] shadow-[0_28px_90px_rgba(0,0,0,0.45)]">
          {trimmedQuery.length < 2 ? (
            <div className="p-5 text-sm text-[var(--ms-body)]">
              Type at least 2 characters to search active games and services.
            </div>
          ) : isLoading ? (
            <SearchSkeleton />
          ) : hasResults ? (
            <div className="max-h-[70vh] overflow-y-auto p-3">
              {results.games?.length ? (
                <section>
                  <p className="mono px-2 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--ms-body)]">Games</p>
                  <div className="space-y-1">
                    {results.games.map((result) => (
                      <ResultRow key={`game-${result.href}`} result={result} onSelect={closeOverlay} />
                    ))}
                  </div>
                </section>
              ) : null}

              {results.services?.length ? (
                <section className={results.games?.length ? "mt-3 border-t border-[var(--ms-border)] pt-3" : ""}>
                  <p className="mono px-2 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--ms-body)]">Services</p>
                  <div className="space-y-1">
                    {results.services.map((result) => (
                      <ResultRow key={`service-${result.href}`} result={result} onSelect={closeOverlay} />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : (
            <div className="p-5">
              <h2 className="font-black text-[var(--ms-heading)]">No matches found</h2>
              <p className="mt-2 text-sm text-[var(--ms-body)]">
                Try another game, service name, genre, or category.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
