import Link from "next/link";
import { notFound } from "next/navigation";
import { PlaceholderAsset } from "@/components/asset-image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getServiceBySlug } from "@/lib/catalog";

type ServicePageProps = {
  params: Promise<{ slug: string }>;
};

const rewards = [
  ["⚚", "Great Vault Reward", "Guaranteed highest item level gear in your weekly Great Vault based on the key completed."],
  ["◇", "End of Dungeon Loot", "A chance to receive high ilvl gear drops directly from the dungeon completion chest."],
  ["↗", "Mythic+ Score", "Significant boost to your Raider.IO score, making it easier to join PUGs in the future."],
  ["₿", "Flightstones & Crests", "Farm essential currency needed to upgrade your current PvE gear to higher tiers."],
];

export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) notFound();

  return (
    <main className="min-h-screen bg-[var(--background)] text-white">
      <SiteHeader />
      <section className="ms-shell grid gap-12 py-20 lg:grid-cols-[1fr_390px]">
        <div>
          <p className="mono text-xs uppercase tracking-[0.22em] text-[var(--accent)]">▱ World of Warcraft</p>
          <h1 className="mt-5 text-4xl font-light tracking-[-0.04em] sm:text-5xl">{service.name}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--muted)]">
            Dominate the leaderboards and secure top-tier loot. Our professional teams guarantee swift and efficient
            Mythic+ clears, helping you achieve your desired keystone level without the grind.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <span className="rounded-md border border-[var(--border)] bg-[var(--panel)] px-4 py-3 mono text-sm">◷ Starts in &lt; 15 mins</span>
            <span className="rounded-md border border-[var(--border)] bg-[var(--panel)] px-4 py-3 mono text-sm text-white">✺ 100% Completion</span>
          </div>
          <PlaceholderAsset alt={`${service.name} service preview`} className="mt-12 h-[380px] rounded-lg" priority imageClassName="p-20" />

          <h2 className="mt-12 border-b border-[var(--border)] pb-5 text-base font-medium">What You Get</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {rewards.map(([icon, title, body]) => (
              <article key={title} className="rounded-lg border border-[var(--border)] bg-[var(--panel-strong)] p-6">
                <div className="flex gap-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#30314c] text-xl text-[var(--accent)]">{icon}</span>
                  <div>
                    <h3 className="mono text-base">{title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{body}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <h2 className="mt-12 border-b border-[var(--border)] pb-5 text-base font-medium">Requirements</h2>
          <ul className="mt-6 space-y-5 text-[var(--muted)]">
            {["Level 70 Character", "Active WoW Subscription", "No specific item level required for self-play."].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="text-[var(--danger-soft)]">◎</span>
                {item}
              </li>
            ))}
          </ul>

          <section className="mt-16 flex min-h-[460px] items-center rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-12">
            <h2 className="mono max-w-xl text-5xl leading-tight tracking-[0.13em]">Why should you choose us</h2>
          </section>
        </div>

        <aside className="h-fit rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] lg:sticky lg:top-8">
          <h2 className="text-lg font-medium">Configure Your Run</h2>
          <p className="mono mt-8 text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Key Level</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {["+10", "+15", "+20"].map((level, index) => (
              <button key={level} className={`${index === 1 ? "ms-button" : "border border-[var(--border)] bg-[#202035]"} h-12 rounded-md mono`}>
                {level}
              </button>
            ))}
          </div>
          <p className="mono mt-8 text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Number of Runs</p>
          <div className="mt-4 flex h-12 items-center justify-between rounded-md border border-[var(--border)] bg-[#202035] px-5 mono text-lg">
            <span>−</span><span>1</span><span>＋</span>
          </div>
          <div className="my-8 space-y-5 border-y border-[var(--border)] py-5">
            <label className="flex items-center justify-between gap-3">
              <span><input type="checkbox" className="mr-3" />VIP Traders (More Loot)</span>
              <span className="mono text-[var(--accent)]">+ $15.00</span>
            </label>
            <label className="flex items-center justify-between gap-3">
              <span><input type="checkbox" defaultChecked className="mr-3" />Express Delivery</span>
              <span className="mono text-[var(--accent)]">+ 20%</span>
            </label>
          </div>
          <div className="flex h-72 items-center justify-center rounded-xl border border-[var(--border)] bg-[#1d1d31]">
            <p className="mono text-3xl tracking-[0.16em]">more settings</p>
          </div>
          <div className="mt-6 flex h-32 items-center rounded-xl border border-[var(--border)] bg-[#1d1d31] p-6">
            <p className="mono text-3xl leading-none">Required items/<br />skills unlock</p>
          </div>
          <div className="mt-8 border-t border-[var(--border)] pt-8">
            <p className="mono text-right text-2xl text-[#6392ff]">$USD ↔</p>
            <div className="mt-8 flex justify-between text-sm">
              <span className="text-[var(--muted)]">Total Price</span>
              <span>${service.startingPrice.toFixed(2)}</span>
            </div>
            <Link href="/cart" className="ms-button mt-7 h-14 w-full mono">
              Add to Cart
            </Link>
          </div>
        </aside>
      </section>
      <SiteFooter />
    </main>
  );
}
