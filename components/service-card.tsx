import Link from "next/link";
import { PlaceholderAsset } from "@/components/asset-image";
import type { GameService } from "@/lib/catalog";

export function ServiceCard({ service }: { service: GameService }) {
  return (
    <article className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)] transition hover:-translate-y-1 hover:border-[var(--primary)] hover:shadow-[0_18px_60px_rgba(136,82,255,0.24)]">
      <PlaceholderAsset alt={`${service.name} preview`} className="h-48">
        <span className="absolute left-3 top-3 rounded bg-[var(--danger-soft)] px-2 py-1 mono text-[10px] font-bold text-[#9b2d32]">
          HOT
        </span>
      </PlaceholderAsset>
      <div className="p-6">
        <h3 className="text-lg font-medium">{service.offerTitle ?? service.name}</h3>
        <p className="mt-3 min-h-12 text-sm leading-6 text-[var(--muted)]">{service.description}</p>
        <div className="mt-6 flex items-center justify-between gap-3">
          <span className="mono text-base text-[var(--accent)]">${service.startingPrice.toFixed(2)}</span>
          <Link href={`/services/${service.slug}`} className="ms-button h-10 px-5 mono text-sm">
            Buy Now
          </Link>
        </div>
      </div>
    </article>
  );
}
