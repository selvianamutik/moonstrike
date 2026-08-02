import type { Metadata } from "next";
import { ServicesCatalog } from "@/components/services-catalog";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { listActiveServices, serviceRowToCatalogService } from "@/lib/cms/services";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://moonstrike.pro';

export const metadata: Metadata = {
  title: "All Services",
  description: "Explore all boosting, coaching, and item services available on Moon Strike across every supported game.",
  alternates: { canonical: `${BASE_URL}/services` },
  openGraph: { url: `${BASE_URL}/services` },
};

type ServicesPageProps = {
  searchParams?: Promise<{
    category?: string;
    q?: string;
  }>;
};

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const params = await searchParams;
  const activeCategory = params?.category ?? "all";
  const query = params?.q ?? "";
  const services = (await listActiveServices()).map(serviceRowToCatalogService);

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />
      <section className="ms-shell py-16">
        <ServicesCatalog activeCategory={activeCategory} query={query} services={services} />
      </section>
      <SiteFooter />
    </main>
  );
}
