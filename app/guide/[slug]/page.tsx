import { notFound } from "next/navigation";
import Link from "next/link";
import { getCustomPageBySlug, listCustomPagesByCategory, getPageRoutePrefix } from "@/lib/admin/custom-pages";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "quill/dist/quill.snow.css";

export default async function GuideArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getCustomPageBySlug(slug, "guide");
  if (!page) notFound();

  const allGuides = await listCustomPagesByCategory("guide");
  const suggested = allGuides.filter((g) => g.id !== page.id).slice(0, 3);

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />
      <section className="ms-shell py-16">
        <article>
          <p className="mono text-xs uppercase tracking-[0.28em] text-[var(--ms-gradient-end)]">Guide</p>
          <h1 className="font-display mt-4 text-4xl font-black tracking-[-0.05em] text-white">{page.title}</h1>

          <div className="mt-8 overflow-hidden rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)]">
            <img
              src={page.image || "/no-image/no-img.png"}
              alt={page.title}
              className="h-64 w-full object-cover md:h-80"
            />
          </div>

          <article
            className="ql-editor mt-8"
            style={{ height: "auto", overflow: "visible", minHeight: 0 }}
            dangerouslySetInnerHTML={{ __html: page.content }}
          />

          {suggested.length > 0 && (
            <div className="mt-16 border-t border-[var(--ms-border)] pt-10">
              <h2 className="text-2xl font-black">Suggested for You</h2>
              <div className="mt-6 grid gap-5 md:grid-cols-3">
                {suggested.map((guide) => (
                  <Link
                    key={guide.id}
                    href={`${getPageRoutePrefix(guide.category)}/${guide.slug}`}
                    className="group rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-5 transition-colors hover:border-[var(--ms-gradient-end)]"
                  >
                    <div className="mb-3 overflow-hidden rounded-lg">
                      <img
                        src={guide.image || "/no-image/no-img.png"}
                        alt={guide.title}
                        className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <h3 className="font-black group-hover:text-[var(--ms-gradient-end)]">{guide.title}</h3>
                    {guide.meta_description && (
                      <p className="mt-2 text-xs leading-5 text-[var(--ms-body)] line-clamp-2">{guide.meta_description}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </section>
      <SiteFooter />
    </main>
  );
}
