import { notFound } from "next/navigation";
import Link from "next/link";
import { getCustomPageBySlug, listCustomPagesByCategory, getPageRoutePrefix } from "@/lib/admin/custom-pages";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "quill/dist/quill.snow.css";

export const dynamic = "force-dynamic";

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getCustomPageBySlug(slug, "blog");
  if (!page) notFound();

  const allBlogs = await listCustomPagesByCategory("blog");
  const suggested = allBlogs.filter((b) => b.id !== page.id).slice(0, 3);
  const newest = allBlogs.filter((b) => b.id !== page.id).slice(0, 5);

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />
      <section className="ms-shell h-full py-16 lg:grid lg:grid-cols-[1fr_300px] lg:gap-10">
        <article>
          <p className="mono text-xs uppercase tracking-[0.28em] text-[var(--ms-gradient-end)]">Blog</p>
          <h1 className="font-display mt-4 text-4xl font-black tracking-[-0.05em] text-white">{page.title}</h1>

          <div className="mt-8 overflow-hidden rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)]">
            <img
              src={page.image || "/no-image/no-img.png"}
              alt={page.title}
              className="h-64 w-full object-cover md:h-80"
            />
          </div>

          <div className="ql-editor mt-8 px-0"
            style={{ height: "auto", overflow: "visible", minHeight: 0 }}
            dangerouslySetInnerHTML={{ __html: page.content }}
          />

          {suggested.length > 0 && (
            <div className="mt-16 border-t border-[var(--ms-border)] pt-10">
              <h2 className="text-2xl font-black">Suggested for You</h2>
              <div className="mt-6 grid gap-5 md:grid-cols-3">
                {suggested.map((blog) => (
                  <Link
                    key={blog.id}
                    href={`${getPageRoutePrefix(blog.category)}/${blog.slug}`}
                    className="group rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-5 transition-colors hover:border-[var(--ms-gradient-end)]"
                  >
                    <div className="mb-3 overflow-hidden rounded-lg">
                      <img
                        src={blog.image || "/no-image/no-img.png"}
                        alt={blog.title}
                        className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <h3 className="font-black group-hover:text-[var(--ms-gradient-end)]">{blog.title}</h3>
                    {blog.meta_description && (
                      <p className="mt-2 text-xs leading-5 text-[var(--ms-body)] line-clamp-2">{blog.meta_description}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>

        <aside className="mt-16 lg:mt-0">
          <div className="rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-6 lg:sticky lg:top-28">
            <h2 className="text-lg font-black">Newest Posts</h2>
            <div className="mt-5 space-y-4">
              {newest.length === 0 ? (
                <p className="text-sm text-[var(--ms-body)]">No other blog posts yet.</p>
              ) : (
                newest.map((blog) => (
                  <Link
                    key={blog.id}
                    href={`${getPageRoutePrefix(blog.category)}/${blog.slug}`}
                    className={`group flex gap-3 rounded-lg p-2 transition-colors hover:bg-[var(--ms-hover-bg)] ${
                      blog.id === page.id ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[var(--ms-border)]">
                      <img
                        src={blog.image || "/no-image/no-img.png"}
                        alt={blog.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-tight group-hover:text-[var(--ms-gradient-end)]">{blog.title}</p>
                      <p className="mono mt-1 text-[10px] uppercase tracking-wider text-[var(--ms-body)]">
                        {new Date(blog.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </aside>
      </section>
      <SiteFooter />
    </main>
  );
}
