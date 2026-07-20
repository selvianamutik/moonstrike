import { getCartService, getPrivateOffer, getPrivateOfferGame, getServiceCategory, getServiceGame, type CartItemRow } from "@/lib/cart";

export function cartItemToCheckoutProduct(item: CartItemRow) {
  const privateOffer = getPrivateOffer(item);
  if (privateOffer) {
    const privateOfferGame = getPrivateOfferGame(privateOffer);
    const image = privateOfferGame?.image?.startsWith("http") ? privateOfferGame.image : undefined;
    return {
      name: privateOffer.title,
      description: [privateOfferGame?.name, privateOffer.category].filter(Boolean).join(" / ") || undefined,
      images: image ? [image] : undefined,
    };
  }

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
