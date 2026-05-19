import { ServiceCard } from "@/components/service-card";
import { PlaceholderAsset } from "@/components/asset-image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { gameServices } from "@/lib/catalog";

const cards = Array.from({ length: 8 }, (_, index) => gameServices[index % gameServices.length]);

export default function GamesPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-white">
      <SiteHeader />
      <section className="ms-shell py-16">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-black tracking-[-0.04em]">All Services</h1>
          <div className="h-12 w-full rounded-md border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-[var(--muted)] md:w-96">
            ⌕ Search games, services...
          </div>
        </div>
        <PlaceholderAsset alt="All services hero preview" className="mt-8 flex h-72 items-center justify-between rounded-md px-16" priority imageClassName="p-16">
          <h2 className="relative z-10 text-3xl font-black">title</h2>
          <div className="relative z-10 text-center">
            <div className="flex gap-2">
              <button className="ms-button h-9 px-4 mono">USA</button>
              <button className="h-9 rounded bg-[var(--panel)] px-4 mono">EUROPE</button>
            </div>
            <p className="mt-3 text-sm text-[#4132ff]">Want to custom order?</p>
          </div>
        </PlaceholderAsset>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
          <button className="h-10 w-10 rounded-full bg-[#282747] text-2xl">←</button>
          {["Hot Offers ♨", "Dungeons", "Powerleveling", "Raid", "Stories"].map((tab, index) => (
            <button key={tab} className={`${index === 1 ? "ms-button" : "border border-[var(--border)] bg-[var(--panel)]"} h-9 rounded px-4 mono text-sm uppercase tracking-[0.22em]`}>
              {tab}
            </button>
          ))}
          <button className="h-10 w-10 rounded-full bg-[#282747] text-2xl">→</button>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((service, index) => (
            <ServiceCard key={`${service.slug}-${index}`} service={service} />
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
