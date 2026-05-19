import Link from "next/link";
import { PlaceholderAsset } from "@/components/asset-image";
import { ServiceCard } from "@/components/service-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Frame18Sections } from "@/components/frame-18-sections";
import { gameServices, trustMetrics } from "@/lib/catalog";

const gameCards = Array.from({ length: 8 }, (_, index) => gameServices[index % gameServices.length]);

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-white">
      <SiteHeader />

      <section className="ms-shell py-20">
        <p className="text-sm font-black uppercase">
          Featured & <span className="section-accent">Recommended</span>
        </p>
        <div className="relative mt-6">
          <button className="absolute -left-24 top-1/2 hidden h-14 w-14 -translate-y-1/2 rounded-full border border-[var(--border)] bg-[#20203b] text-3xl text-[var(--muted)] xl:block">
            ‹
          </button>
          <button className="absolute -right-24 top-1/2 hidden h-14 w-14 -translate-y-1/2 rounded-full border border-[var(--border)] bg-[#20203b] text-3xl text-[var(--muted)] xl:block">
            ›
          </button>
          <div className="grid overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--panel)] lg:grid-cols-[1fr_260px]">
            <PlaceholderAsset alt="Void Descent seasonal event" className="min-h-[450px]" priority imageClassName="p-20">
              <div className="absolute bottom-8 left-8 max-w-xl">
                <span className="rounded bg-[var(--accent)]/25 px-3 py-1 mono text-xs font-bold uppercase text-[var(--accent)]">
                  New Update
                </span>
                <h1 className="mt-4 text-lg font-medium">Void Descent: Seasonal Event</h1>
                <p className="mt-3 max-w-lg text-[var(--muted)]">
                  Master the new challenge rifts and claim exclusive cosmic armor sets before the season ends.
                </p>
                <Link href="/games" className="ms-button mt-6 h-10 px-6">
                  Learn More
                </Link>
              </div>
            </PlaceholderAsset>
            <aside className="border-l border-[var(--border)] p-5">
              <p className="mono text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Coming Soon</p>
              {["Elite Trials Return", "Mythic+ Cache Update", "Ranked Climb Events"].map((item) => (
                <div key={item} className="mt-5 flex gap-4">
                  <PlaceholderAsset alt={`${item} preview`} className="h-12 w-20 rounded" imageClassName="p-3" />
                  <p className="text-sm leading-4">
                    <span className="block font-black uppercase text-[var(--accent)]">Featured</span>
                    <span className="text-[var(--muted)]">{item}</span>
                  </p>
                </div>
              ))}
            </aside>
          </div>
        </div>
      </section>

      <section className="ms-shell py-10">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl font-black tracking-[-0.04em]">Best <span className="section-accent">Offers</span></h2>
          <Link href="/games" className="mono text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
            View all deals →
          </Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {gameServices.slice(0, 4).map((service) => (
            <ServiceCard key={service.slug} service={service} />
          ))}
        </div>
      </section>

      <section className="ms-shell py-14">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl font-black tracking-[-0.04em]">All <span className="section-accent">Games</span></h2>
          <Link href="/games" className="mono text-sm uppercase tracking-[0.3em] text-[var(--accent)]">
            View all →
          </Link>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-5">
          <button className="h-10 w-10 rounded-full bg-[#282747] text-2xl">←</button>
          {["All Games", "Action RPG", "Tactical Shooting", "Looter Shooting"].map((tab, index) => (
            <button key={tab} className={`${index === 0 ? "ms-button" : "border border-[var(--border)] bg-[var(--panel)]"} h-9 rounded px-4 mono text-sm uppercase tracking-[0.22em]`}>
              {tab}
            </button>
          ))}
          <button className="h-10 w-10 rounded-full bg-[#282747] text-2xl">→</button>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {gameCards.map((service, index) => (
            <article key={`${service.slug}-${index}`} className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)]">
              <PlaceholderAsset alt="Diablo IV preview" className="h-52" />
              <div className="p-5">
                <div className="flex gap-2 mono text-[11px]">
                  <span className="rounded bg-[#232744] px-2 py-1 text-[var(--accent)]">Action RPG</span>
                  <span className="rounded bg-[#2a2943] px-2 py-1 text-[var(--muted)]">Cross-play</span>
                </div>
                <h3 className="mt-3 text-2xl font-black">Diablo IV</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Power level to max tier, farm legendary unique items, and clear</p>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/games" className="inline-flex rounded-md bg-[#2a2a43] px-8 py-4 font-bold">
            Load More Games
          </Link>
        </div>
      </section>

      <section className="mt-10 border-y border-[var(--border)] bg-[var(--panel)] py-8">
        <div className="ms-shell grid grid-cols-2 gap-6 text-center md:grid-cols-4">
          {trustMetrics.concat({ value: "Top 1%", label: "Pro players" }).map((metric) => (
            <div key={metric.label}>
              <p className="mono text-2xl font-bold">{metric.value}</p>
              <p className="mono mt-2 text-xs uppercase tracking-[0.28em] text-[var(--muted)]">{metric.label}</p>
            </div>
          ))}
        </div>
      </section>

      <Frame18Sections />

      <SiteFooter />
    </main>
  );
}
