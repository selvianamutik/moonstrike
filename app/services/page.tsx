import { ServicesCatalog, type ServiceCategoryFilter } from "@/components/services-catalog";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { gameServices } from "@/lib/catalog";

type ServicesPageProps = {
  searchParams?: Promise<{
    category?: string;
    q?: string;
  }>;
};

const serviceCategories: ServiceCategoryFilter[] = ["hot", "dungeon", "powerleveling", "raid", "stories"];

function getServiceCategory(value: string | undefined): ServiceCategoryFilter {
  if (value && serviceCategories.includes(value as ServiceCategoryFilter)) {
    return value as ServiceCategoryFilter;
  }

  return "hot";
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const params = await searchParams;
  const activeCategory = getServiceCategory(params?.category);
  const query = params?.q ?? "";

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />
      <section className="ms-shell py-16">
        <ServicesCatalog activeCategory={activeCategory} query={query} services={gameServices} />
      </section>
      <SiteFooter />
    </main>
  );
}
