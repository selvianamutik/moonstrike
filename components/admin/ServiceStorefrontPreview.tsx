import Link from "next/link";
import { PlaceholderAsset } from "@/components/asset-image";
import { Badge, RegionSelector } from "@/components/ui";
import type { AdminService } from "@/lib/admin-mock";

const defaultRewards = [
  ["Fast Start", "Verified booster team ready after checkout."],
  ["Clear Progress", "Milestones tracked through delivery."],
  ["Targeted Outcome", "Focused on the service goal you purchased."],
  ["Support Ready", "Support available through completion."],
];

type ServiceStorefrontPreviewProps = {
  service: AdminService;
  previewMode?: boolean;
};

export function ServiceStorefrontPreview({ service, previewMode = false }: ServiceStorefrontPreviewProps) {
  return (
    <div className="rounded-xl border border-[var(--ms-accent)] overflow-hidden bg-[var(--ms-primary)]">
      {previewMode && (
        <div className="bg-amber-500/15 border-b border-amber-500/40 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-amber-400">
            PREVIEW MODE — This service is not yet published
          </p>
          <div className="flex gap-2">
            <Link
              href={`/admin/services/${service.id}/edit`}
              className="text-sm text-[var(--ms-text-secondary)] hover:text-white px-3 py-1.5 border border-[var(--ms-accent)] rounded-lg"
            >
              Back to Editor
            </Link>
            <button
              type="button"
              className="text-sm font-medium text-white px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#6366F1]"
            >
              Deploy Now
            </button>
          </div>
        </div>
      )}

      <div className="p-8 grid gap-12 lg:grid-cols-[1fr_360px]">
        <div>
          <nav className="mono text-xs uppercase tracking-[0.22em] text-[#22D3EE]">
            Services / {service.gameName}
          </nav>
          <h1 className="font-display mt-5 text-4xl font-black tracking-[-0.04em] text-white">{service.name}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--ms-text-secondary)]">{service.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Badge variant="featured">{service.serviceCategory}</Badge>
            {service.badges.map((b) => (
              <Badge key={b} variant="new">
                {b}
              </Badge>
            ))}
            {service.isHotOffer && <Badge variant="hot">HOT</Badge>}
          </div>
          <PlaceholderAsset
            alt={service.name}
            className="mt-10 h-[320px] rounded-lg border border-[var(--ms-accent)]"
            imageClassName="p-16"
          />
          <h2 className="mt-10 border-b border-[var(--ms-accent)] pb-4 text-base font-medium text-white">What You Get</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {defaultRewards.map(([title, body]) => (
              <article key={title} className="rounded-lg border border-[var(--ms-accent)] bg-[var(--ms-secondary)] p-5">
                <h3 className="mono text-sm text-white">{title}</h3>
                <p className="mt-2 text-sm text-[var(--ms-text-secondary)]">{body}</p>
              </article>
            ))}
          </div>
          <h2 className="mt-10 border-b border-[var(--ms-accent)] pb-4 text-base font-medium text-white">Requirements</h2>
          <ul className="mt-4 space-y-3 text-[var(--ms-text-secondary)] text-sm">
            <li>Active game account with access to selected content.</li>
            <li>Correct region selected before checkout.</li>
            <li>Account details shared via support chat after purchase.</li>
          </ul>
        </div>
        <aside className="rounded-xl border border-[var(--ms-accent)] bg-[var(--ms-secondary)] p-6 h-fit lg:sticky lg:top-4">
          <h2 className="text-lg text-white font-medium">Configure Your Run</h2>
          <div className="mt-4">
            <RegionSelector active="USA" />
          </div>
          <p className="mono mt-6 text-xs uppercase tracking-[0.18em] text-[var(--ms-text-secondary)]">Service Type</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" className="ms-button h-10 rounded-md mono text-xs">
              {service.serviceCategory}
            </button>
            <button
              type="button"
              className="h-10 rounded-md mono text-xs border border-[var(--ms-accent)] text-[var(--ms-text-secondary)]"
            >
              Express
            </button>
          </div>
          <div className="mt-8 border-t border-[var(--ms-accent)] pt-6">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--ms-text-secondary)]">Total Price</span>
              <span className="mono text-[#22D3EE]">${service.basePriceUsd.toFixed(2)}</span>
            </div>
            <button type="button" disabled className="mt-6 w-full h-12 rounded-md bg-[var(--ms-accent)] text-[var(--ms-text-secondary)] mono text-sm cursor-not-allowed">
              Buy Now (preview)
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
