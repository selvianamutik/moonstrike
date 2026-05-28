import Link from "next/link";
import { notFound } from "next/navigation";
import { PlaceholderAsset } from "@/components/asset-image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge, RegionSelector } from "@/components/ui";
import { getServiceByGameAndSlug } from "@/lib/catalog";

type ServicePageProps = {
  params: Promise<{ game: string; slug: string }>;
};

const rewards = [
  ["Fast Start", "A verified booster team is ready to begin shortly after checkout and order confirmation."],
  ["Clear Progress", "Order progress is tracked through delivery milestones so you always know the current state."],
  ["Targeted Outcome", "The selected run is focused on the service goal, rewards, and completion target you purchased."],
  ["Support Ready", "Support stays available from checkout through completion for questions or delivery updates."],
];

const requirements = [
  "Active game account with access to the selected content.",
  "Correct region selected before checkout.",
  "Account-specific details shared through support chat after purchase.",
];

export default async function ServicePage({ params }: ServicePageProps) {
  const { game, slug } = await params;
  const service = getServiceByGameAndSlug(game, slug);

  if (!service) notFound();

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />
      <section className="ms-shell grid gap-12 py-20 lg:grid-cols-[1fr_390px]">
        <div>
          <nav className="mono text-xs uppercase tracking-[0.22em] text-[var(--ms-gradient-end)]">
            <Link href="/services" className="hover:text-[var(--ms-heading)]">
              Services
            </Link>
            <span className="mx-3 text-[var(--ms-body)]">/</span>
            <span>{service.gameName}</span>
          </nav>
          <h1 className="font-display mt-5 text-4xl font-black tracking-[-0.04em] sm:text-5xl">{service.name}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--ms-body)]">{service.description}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Badge variant="featured">{service.serviceCategory}</Badge>
            <Badge variant="featured">Starts in &lt; 15 mins</Badge>
            <Badge variant="new">100% Completion</Badge>
          </div>
          <PlaceholderAsset
            alt={`${service.name} service preview`}
            className="mt-12 h-[380px] rounded-lg border border-[var(--ms-border)]"
            priority
            imageClassName="p-20"
          />

          <h2 className="mt-12 border-b border-[var(--ms-border)] pb-5 text-base font-medium">What You Get</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {rewards.map(([title, body]) => (
              <article key={title} className="ms-card ms-card-hover rounded-lg p-6">
                <div className="flex gap-5">
                  <span className="mono flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[var(--ms-hover-bg)] text-sm font-bold text-[var(--ms-gradient-end)]">
                    MS
                  </span>
                  <div>
                    <h3 className="mono text-base text-[var(--ms-heading)]">{title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--ms-body)]">{body}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <h2 className="mt-12 border-b border-[var(--ms-border)] pb-5 text-base font-medium">Requirements</h2>
          <ul className="mt-6 space-y-5 text-[var(--ms-body)]">
            {requirements.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="text-[var(--ms-danger)]">-</span>
                {item}
              </li>
            ))}
          </ul>

          <section className="ms-card mt-16 flex min-h-[360px] items-center rounded-xl p-12">
            <div>
              <h2 className="font-display max-w-xl text-4xl font-black leading-tight tracking-[-0.04em]">
                Why should you choose us?
              </h2>
              <p className="mt-5 max-w-xl leading-8 text-[var(--ms-body)]">
                Verified boosters, clear order communication, and support-ready delivery from checkout through
                completion.
              </p>
            </div>
          </section>
        </div>

        <aside className="ms-card h-fit rounded-xl p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] lg:sticky lg:top-32">
          <h2 className="text-lg font-medium">Configure Your Run</h2>
          <div className="mt-6">
            <RegionSelector active="USA" />
          </div>
          <p className="mono mt-8 text-sm uppercase tracking-[0.18em] text-[var(--ms-body)]">Service Type</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[service.serviceCategory, "Express"].map((option, index) => (
              <button
                key={option}
                className={`${
                  index === 0
                    ? "ms-button"
                    : "border border-[var(--ms-border)] bg-[var(--ms-bg-card)] hover:bg-[var(--ms-hover-bg)]"
                } h-12 rounded-md mono`}
              >
                {option}
              </button>
            ))}
          </div>
          <p className="mono mt-8 text-sm uppercase tracking-[0.18em] text-[var(--ms-body)]">Number of Runs</p>
          <div className="mt-4 flex h-12 items-center justify-between rounded-md border border-[var(--ms-border)] bg-[var(--ms-bg-card)] px-5 mono text-lg">
            <span>-</span>
            <span>1</span>
            <span>+</span>
          </div>
          <div className="my-8 space-y-5 border-y border-[var(--ms-border)] py-5">
            <label className="flex items-center justify-between gap-3">
              <span>
                <input type="checkbox" className="mr-3" />
                Priority Scheduling
              </span>
              <span className="mono text-[var(--ms-price)]">+ $15.00</span>
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>
                <input type="checkbox" defaultChecked className="mr-3" />
                Live Updates
              </span>
              <span className="mono text-[var(--ms-price)]">Included</span>
            </label>
          </div>
          <div className="rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-5">
            <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--ms-body)]">More settings</p>
            <p className="mt-3 text-sm leading-6 text-[var(--ms-body)]">
              Option schema rendering will replace this placeholder with single-choice, multi-choice, and scalar
              controls.
            </p>
          </div>
          <div className="mt-8 border-t border-[var(--ms-border)] pt-8">
            <p className="mono text-right text-sm uppercase tracking-[0.18em] text-[var(--ms-body)]">Currency: USD</p>
            <div className="mt-8 flex justify-between text-sm">
              <span className="text-[var(--ms-body)]">Total Price</span>
              <span className="mono text-[var(--ms-price)]">${service.startingPrice.toFixed(2)}</span>
            </div>
            <Link href="/cart" className="ms-button mt-7 h-14 w-full mono">
              Buy Now
            </Link>
          </div>
        </aside>
      </section>
      <SiteFooter />
    </main>
  );
}
