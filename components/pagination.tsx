import Link from "next/link";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchQuery: string;
};

export function Pagination({ currentPage, totalPages, basePath, searchQuery }: PaginationProps) {
  if (totalPages <= 1) return null;

  function href(page: number) {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const pages: (number | "dots")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "dots") {
      pages.push("dots");
    }
  }

  return (
    <nav className="mt-16 flex items-center justify-center gap-2" aria-label="Pagination">
      {currentPage > 1 && (
        <Link
          href={href(currentPage - 1)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--ms-border)] text-sm text-[var(--ms-body)] transition-colors hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-gradient-end)]"
          aria-label="Previous page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
      )}

      {pages.map((p, i) =>
        p === "dots" ? (
          <span key={`dots-${i}`} className="flex h-10 w-10 items-center justify-center text-sm text-[var(--ms-body)]">
            &hellip;
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold transition-colors ${
              p === currentPage
                ? "bg-[var(--ms-gradient-end)] text-[var(--ms-bg-page)]"
                : "border border-[var(--ms-border)] text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-gradient-end)]"
            }`}
          >
            {p}
          </Link>
        )
      )}

      {currentPage < totalPages && (
        <Link
          href={href(currentPage + 1)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--ms-border)] text-sm text-[var(--ms-body)] transition-colors hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-gradient-end)]"
          aria-label="Next page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Link>
      )}
    </nav>
  );
}
