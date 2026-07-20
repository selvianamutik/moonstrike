import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCustomPageBySlug } from "@/lib/admin/custom-pages";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "quill/dist/quill.snow.css";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getCustomPageBySlug(slug, "page");
  if (!page) return {};

  return {
    title: page.title,
    description: page.meta_description || undefined,
  };
}

export default async function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getCustomPageBySlug(slug, "page");
  if (!page) notFound();

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-6 py-24">
        <p className="mono text-xs uppercase tracking-[0.24em] text-[var(--ms-gradient-end)]">Information</p>
        <h1 className="font-display mt-4 text-5xl font-black tracking-[-0.05em]">{page.title}</h1>
        <p className="mt-5 text-[var(--ms-body)]">
          Effective Date: {new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(page.updated_at))}
        </p>

        <div className="ms-card mt-14 rounded-xl p-8 sm:p-12">
          <article
            className="ql-editor"
            style={{ height: "auto", overflow: "visible", minHeight: 0 }}
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>


      </section>
      <SiteFooter />
    </main>
  );
}
