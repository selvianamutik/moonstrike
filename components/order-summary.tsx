import Link from "next/link";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { PlaceholderAsset } from "@/components/asset-image";

type VoucherDiscount = {
  code: string
  discountAmount: string
  discountPercentage: number
}

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
  voucher?: VoucherDiscount | null;
  vouchers?: VoucherDiscount[];
  onVoucherRemoved?: (index: number) => void;
};

export function OrderSummary({ ctaHref, ctaLabel, items, rows, serviceName, serviceMeta, total, voucher, vouchers, onVoucherRemoved }: OrderSummaryProps) {
  const ctaClassName = "ms-button mt-8 flex h-14 w-full items-center justify-center rounded-md text-lg font-black";
  const voucherList = vouchers && vouchers.length > 0 ? vouchers : (voucher ? [voucher] : []);

  return (
    <aside className="ms-card h-fit rounded-xl p-8 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
      <h2 className="border-b border-[var(--ms-border)] pb-5 text-2xl font-black">Order Summary</h2>
      <div className="flex gap-4 border-b border-[var(--ms-border)] py-7">
        {items && items.length > 0 && items[0].image ? (
          <div className="relative h-20 w-20 overflow-hidden rounded-md border border-[var(--ms-border)] bg-[var(--ms-bg-card)]">
            <Image
              src={items[0].image}
              alt={items[0].name || "Order item preview"}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
        ) : (
          <PlaceholderAsset isHidden={false} alt="Order item preview" className="h-20 w-20 rounded-md" imageClassName="p-3" />
        )}
        <div className="flex-1">
          <h3 className="font-bold">{serviceName}</h3>
          <p className="mono mt-1 text-xs text-[var(--ms-price)]">{serviceMeta}</p>
        </div>
        <p className="font-bold">{total}</p>
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
      {voucherList.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {voucherList.map((v, index) => (
            <div
              key={`${v.code}-${index}`}
              className="flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2"
            >
              <div className="flex items-center gap-2 text-green-400">
                <span className="text-sm font-medium">Discount ({v.code}: {v.discountPercentage}%)</span>
                <span className="text-sm font-bold">-{v.discountAmount}</span>
              </div>
              {onVoucherRemoved ? (
                <button
                  type="button"
                  onClick={() => onVoucherRemoved(index)}
                  className="inline-flex items-center justify-center rounded-md border border-red-500/30 bg-red-500/10 p-1.5 text-red-400 transition-colors hover:bg-red-500/20"
                  aria-label="Remove voucher"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
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
