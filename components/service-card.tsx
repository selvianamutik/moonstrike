import Link from "next/link";
import { PlaceholderAsset } from "@/components/asset-image";
import { Badge } from "@/components/ui";
import { getServiceDetailHref, type GameService } from "@/lib/catalog";

export function ServiceCard({ service }: { service: GameService }) {
  return (
    <article className="ms-card ms-card-hover overflow-hidden rounded-lg">
      <PlaceholderAsset alt={`${service.name} preview`} className="h-48">
        {service.isHotOffer ? <span className="absolute left-3 top-3"><Badge variant="hot" /></span> : null}
      </PlaceholderAsset>
      <div className="p-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant="featured">{service.serviceCategory}</Badge>
        </div>
        <h3 className="mt-4 text-lg font-bold text-[var(--ms-heading)]">{service.offerTitle ?? service.name}</h3>
        <p className="mt-3 min-h-12 text-sm leading-6 text-[var(--ms-body)]">{service.description}</p>
        <div className="mt-6 flex items-center justify-between gap-3">
          <span className="mono text-base font-bold text-[var(--ms-price)]">${service.startingPrice.toFixed(2)}</span>
          <Link href={getServiceDetailHref(service)} className="ms-button h-10 px-5 mono text-sm">
            Buy Now
          </Link>
        </div>
      </div>
    </article>
  );
}
