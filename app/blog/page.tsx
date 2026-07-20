import Link from "next/link";
import { listCustomPagesByCategory, getPageRoutePrefix } from "@/lib/admin/custom-pages";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SearchBar } from "@/components/search-bar";
import { Pagination } from "@/components/pagination";

export const dynamic = "force-dynamic";

const PER_PAGE = 10;

export default async function BlogListing({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10) || 1);
  const searchQuery = q?.trim() || "";

  let blogs = await listCustomPagesByCategory("blog");

  if (searchQuery) {
    const qLower = searchQuery.toLowerCase();
    blogs = blogs.filter((b) => b.title.toLowerCase().includes(qLower));
  }

  const totalPages = Math.max(1, Math.ceil(blogs.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paged = blogs.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />

      <section className="ms-shell py-20">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mono text-xs uppercase tracking-[0.28em] text-[var(--ms-gradient-end)]">Our Blog</p>
            <h1 className="font-display mt-4 text-4xl font-black tracking-[-0.05em]">
              Latest <span className="section-accent">Posts</span>
            </h1>
            <p className="mt-2 text-[var(--ms-body)]">Tips, updates, and insights from the Moon Strike team.</p>
          </div>

          <div className="w-full sm:w-72">
            <SearchBar placeholder="Search posts..." defaultValue={searchQuery} basePath="/blog" />
          </div>
        </div>

        {blogs.length === 0 ? (
          <p className="mt-20 text-center text-[var(--ms-body)]">
            {searchQuery
              ? `No posts match "${searchQuery}".`
              : "No blog posts yet. Check back soon!"}
          </p>
        ) : paged.length === 0 ? (
          <>
            <p className="mt-20 text-center text-[var(--ms-body)]">
              No posts on page {safePage}.{" "}
              <Link href="/blog" className="text-[var(--ms-gradient-end)] underline">
                Go to first page
              </Link>
            </p>
          </>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paged.map((blog) => (
              <Link
                key={blog.id}
                href={`${getPageRoutePrefix(blog.category)}/${blog.slug}`}
                className="group overflow-hidden rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] transition-colors hover:border-[var(--ms-gradient-end)]"
              >
                <div className="relative h-48 overflow-hidden bg-[var(--ms-bg-card)]">
                  <img
                    src={blog.image || "/no-image/no-img.png"}
                    alt={blog.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/35" />
                </div>
                <div className="p-5">
                  <p className="mono text-[10px] uppercase tracking-wider text-[var(--ms-body)]">
                    {new Date(blog.created_at).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <h3 className="mt-2 font-black group-hover:text-[var(--ms-gradient-end)]">{blog.title}</h3>
                  {blog.meta_description && (
                    <p className="mt-2 text-xs leading-5 text-[var(--ms-body)] line-clamp-2">
                      {blog.meta_description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <Pagination currentPage={safePage} totalPages={totalPages} basePath="/blog" searchQuery={searchQuery} />
      </section>

      <SiteFooter />
    </main>
  );
}
