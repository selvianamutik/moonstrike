import Link from "next/link";
import { PlaceholderAsset } from "@/components/asset-image";

type OrderSummaryProps = {
  ctaHref?: string;
  ctaLabel?: string;
  rows: Array<{
    label: string;
    value: string;
  }>;
  items?: Array<{
    id: string;
    image?: string;
    meta?: string;
    name: string;
    price: string;
  }>;
  serviceName: string;
  serviceMeta: string;
  total: string;
};

export function OrderSummary({ ctaHref, ctaLabel, items, rows, serviceName, serviceMeta, total }: OrderSummaryProps) {
  const ctaClassName = "ms-button mt-8 flex h-14 w-full items-center justify-center rounded-md text-lg font-black";

  return (
    <aside className="ms-card h-fit rounded-xl p-8 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
      <h2 className="border-b border-[var(--ms-border)] pb-5 text-2xl font-black">Order Summary</h2>
      <div className="py-5">
        {items && items.length > 0 ? (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                {item.image ? (
                  <img src={item.image} alt="" className="h-16 w-16 rounded-md object-cover" />
                ) : (
                  <PlaceholderAsset alt={`${item.name} preview`} className="h-16 w-16 rounded-md" imageClassName="p-2" />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold">{item.name}</h3>
                  {item.meta ? <p className="mono mt-1 text-xs text-[var(--ms-body)]">{item.meta}</p> : null}
                </div>
                <p className="mono text-sm font-bold text-[var(--ms-price)]">{item.price}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4">
            <PlaceholderAsset alt="Order item preview" className="h-20 w-20 rounded-md" imageClassName="p-3" />
            <div className="flex-1">
              <h3 className="font-bold">{serviceName}</h3>
              <p className="mono mt-1 text-xs text-[var(--ms-price)]">{serviceMeta}</p>
            </div>
            <p className="font-bold">{total}</p>
          </div>
        )}
      </div>
      {rows.length > 0 ? (
        <div>
          {rows.map((row) => (
            <div key={row.label} className="mt-6 flex justify-between text-[var(--ms-body)]">
              <span>{row.label}</span>
              <span className="text-[var(--ms-heading)]">{row.value}</span>
            </div>
          ))}
        </div>
      ) : null}
      <div className="mt-8 flex items-center justify-between border-t border-[var(--ms-border)] pt-7">
        <span className="font-bold">Total</span>
        <span className="text-4xl font-black text-[var(--ms-price)] drop-shadow-[0_0_12px_rgba(34,211,238,0.45)]">
          {total}
        </span>
      </div>
      {ctaHref && ctaLabel ? (
        <Link href={ctaHref} className={ctaClassName}>
          {ctaLabel}
        </Link>
      ) : null}
      <p className="mono mt-6 text-center text-xs uppercase text-[var(--ms-body)]">256-bit SSL encrypted</p>
    </aside>
  );
}
