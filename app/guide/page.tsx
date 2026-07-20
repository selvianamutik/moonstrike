import Link from "next/link";
import { listCustomPagesByCategory, getPageRoutePrefix } from "@/lib/admin/custom-pages";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SearchBar } from "@/components/search-bar";
import { Pagination } from "@/components/pagination";

export const dynamic = "force-dynamic";

const PER_PAGE = 10;

export default async function GuideListing({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10) || 1);
  const searchQuery = q?.trim() || "";

  let guides = await listCustomPagesByCategory("guide");

  if (searchQuery) {
    const qLower = searchQuery.toLowerCase();
    guides = guides.filter((g) => g.title.toLowerCase().includes(qLower));
  }

  const totalPages = Math.max(1, Math.ceil(guides.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paged = guides.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />

      <section className="ms-shell py-20">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mono text-xs uppercase tracking-[0.28em] text-[var(--ms-gradient-end)]">Guides</p>
            <h1 className="font-display mt-4 text-4xl font-black tracking-[-0.05em]">
              Game <span className="section-accent">Guides</span>
            </h1>
            <p className="mt-2 text-[var(--ms-body)]">Step-by-step tutorials and walkthroughs to level up your gameplay.</p>
          </div>

          <div className="w-full sm:w-72">
            <SearchBar placeholder="Search guides..." defaultValue={searchQuery} basePath="/guide" />
          </div>
        </div>

        {guides.length === 0 ? (
          <p className="mt-20 text-center text-[var(--ms-body)]">
            {searchQuery
              ? `No guides match "${searchQuery}".`
              : "No guides yet. Check back soon!"}
          </p>
        ) : paged.length === 0 ? (
          <>
            <p className="mt-20 text-center text-[var(--ms-body)]">
              No guides on page {safePage}.{" "}
              <Link href="/guide" className="text-[var(--ms-gradient-end)] underline">
                Go to first page
              </Link>
            </p>
          </>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paged.map((guide) => (
              <Link
                key={guide.id}
                href={`${getPageRoutePrefix(guide.category)}/${guide.slug}`}
                className="group overflow-hidden rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] transition-colors hover:border-[var(--ms-gradient-end)]"
              >
                <div className="relative h-48 overflow-hidden bg-[var(--ms-bg-card)]">
                  <img
                    src={guide.image || "/no-image/no-img.png"}
                    alt={guide.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/35" />
                </div>
                <div className="p-5">
                  <h3 className="font-black group-hover:text-[var(--ms-gradient-end)]">{guide.title}</h3>
                  {guide.meta_description && (
                    <p className="mt-2 text-xs leading-5 text-[var(--ms-body)] line-clamp-2">
                      {guide.meta_description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <Pagination currentPage={safePage} totalPages={totalPages} basePath="/guide" searchQuery={searchQuery} />
      </section>

      <SiteFooter />
    </main>
  );
}
