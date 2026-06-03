import type { CartItemRow, SelectionValue } from "@/lib/cart";

export type CheckoutSnapshotItem = {
  cartItemId: string;
  serviceId: string;
  selectedOptions: Record<string, SelectionValue>;
  selectedOptionsSnapshot: Record<string, { value: SelectionValue; priceUSD: number; priceEUR: number }>;
  priceUSD: number;
  priceEUR: number;
  product: {
    name: string;
    description?: string;
    image?: string;
  };
};

export function isCheckoutSnapshotItem(value: unknown): value is CheckoutSnapshotItem {
  if (!value || typeof value !== "object") return false;

  const item = value as Partial<CheckoutSnapshotItem>;
  return (
    typeof item.cartItemId === "string" &&
    typeof item.serviceId === "string" &&
    typeof item.priceUSD === "number" &&
    typeof item.priceEUR === "number" &&
    !!item.product &&
    typeof item.product === "object" &&
    typeof item.product.name === "string"
  );
}

export function isCheckoutSnapshotItems(value: unknown): value is CheckoutSnapshotItem[] {
  return Array.isArray(value) && value.every(isCheckoutSnapshotItem);
}

export function snapshotFromCartItem(
  item: CartItemRow,
  product: CheckoutSnapshotItem["product"],
): CheckoutSnapshotItem {
  return {
    cartItemId: item.id,
    serviceId: item.service_id,
    selectedOptions: item.selected_options,
    selectedOptionsSnapshot: item.selected_options_snapshot,
    priceUSD: Number(item.price_usd),
    priceEUR: Number(item.price_eur),
    product,
  };
}
