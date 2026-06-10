import { getCartService, getServiceCategory, getServiceGame, type CartItemRow } from "@/lib/cart";

export function cartItemToCheckoutProduct(item: CartItemRow) {
  const service = getCartService(item);
  const game = getServiceGame(service);
  const category = getServiceCategory(service);
  const image = service?.image?.startsWith("http") ? service.image : undefined;

  return {
    name: service?.title ?? "Moon Strike Service",
    description: [game?.name, category?.name].filter(Boolean).join(" / ") || undefined,
    images: image ? [image] : undefined,
  };
}
