export type GameService = {
  slug: string;
  name: string;
  offerTitle?: string;
  category: string;
  description: string;
  startingPrice: number;
  tags: string[];
};

export type CartLineItem = {
  id: string;
  serviceSlug: string;
  quantity: number;
  region: string;
  selectedOptions: Array<{
    group: string;
    value: string;
    priceModifier: number;
  }>;
};

export type DetailOrder = {
  id: string;
  userName: string;
  serviceSlug: string;
  quantity: number;
  region: string;
  selectedOptions: CartLineItem["selectedOptions"];
  status: "waiting_payment" | "paid" | "assigned" | "in_progress" | "completed" | "cancelled" | "refunded";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  transactionId: string;
  createdAt: string;
};

export const trustMetrics = [
  { value: "50K+", label: "Gamers served" },
  { value: "98.7%", label: "Completion rate" },
  { value: "24/7", label: "Support lane" },
];

export const gameServices: GameService[] = [
  {
    slug: "valorant-rank-boost",
    name: "Valorant Rank Boost",
    offerTitle: "Ranked Placement",
    category: "Competitive FPS",
    description: "Climb from your current rank to a target division with vetted high-MMR boosters.",
    startingPrice: 29,
    tags: ["Rank boost", "Duo option", "Express"],
  },
  {
    slug: "destiny-2-raid-clear",
    name: "Destiny 2 Raid Clear",
    offerTitle: "Flawless Trials",
    category: "Raid completion",
    description: "Book guided raid clears, exotic farming, and weekly pinnacle progression.",
    startingPrice: 39,
    tags: ["Raid", "Loot", "Guided"],
  },
  {
    slug: "wow-mythic-plus",
    name: "Mythic+ Dungeons Boost",
    offerTitle: "Mythic+ 15 Run",
    category: "MMO progression",
    description: "Secure timed dungeon runs with keystone level selection and loot preferences.",
    startingPrice: 24,
    tags: ["Dungeon", "Timed", "Loot"],
  },
  {
    slug: "mobile-legends-rank",
    name: "Mobile Legends Rank",
    offerTitle: "Leveling 1-70",
    category: "Mobile MOBA",
    description: "Fast rank progression for busy players who need reliable win-rate support.",
    startingPrice: 19,
    tags: ["Rank", "Mobile", "Fast queue"],
  },
  {
    slug: "apex-legends-coaching",
    name: "Apex Legends Coaching",
    offerTitle: "Coaching Session",
    category: "Coaching",
    description: "Mechanics review, ranked strategy, legend selection, and VOD feedback.",
    startingPrice: 35,
    tags: ["Coaching", "VOD", "Ranked"],
  },
  {
    slug: "rare-item-farming",
    name: "Rare Item Farming",
    offerTitle: "Rare Loot Farm",
    category: "Item service",
    description: "Targeted farming for rare drops, cosmetics, and event-limited rewards.",
    startingPrice: 45,
    tags: ["Items", "Farming", "Events"],
  },
];

export const cartItems: CartLineItem[] = [
  {
    id: "cart_1001",
    serviceSlug: "wow-mythic-plus",
    quantity: 1,
    region: "USA",
    selectedOptions: [
      { group: "Key Level", value: "+15", priceModifier: 21 },
      { group: "Number of Runs", value: "1 run", priceModifier: 0 },
      { group: "Delivery Type", value: "Express Delivery", priceModifier: 9 },
      { group: "Loot Option", value: "VIP Traders", priceModifier: 15 },
    ],
  },
  {
    id: "cart_1002",
    serviceSlug: "valorant-rank-boost",
    quantity: 1,
    region: "Europe",
    selectedOptions: [
      { group: "Current Rank", value: "Gold II", priceModifier: 0 },
      { group: "Target Rank", value: "Diamond I", priceModifier: 60 },
      { group: "Queue Type", value: "Duo option", priceModifier: 18 },
    ],
  },
];

export const detailOrders: DetailOrder[] = [
  {
    id: "MS-2401",
    userName: "Guest Customer",
    serviceSlug: "wow-mythic-plus",
    quantity: 1,
    region: "USA",
    selectedOptions: cartItems[0].selectedOptions,
    status: "in_progress",
    paymentStatus: "paid",
    transactionId: "TRX-88421",
    createdAt: "2026-05-17",
  },
];

export function getServiceBySlug(slug: string) {
  return gameServices.find((service) => service.slug === slug);
}

export function getCartLines() {
  return cartItems.map((item) => {
    const service = getServiceBySlug(item.serviceSlug);

    if (!service) {
      throw new Error(`Missing service for cart line: ${item.serviceSlug}`);
    }

    return {
      ...item,
      service,
      lineTotal: calculateConfiguredPrice(service.startingPrice, item.selectedOptions) * item.quantity,
    };
  });
}

export function getOrderById(orderId: string) {
  const order = detailOrders.find((item) => item.id.toLowerCase() === orderId.toLowerCase());

  if (!order) return undefined;

  const service = getServiceBySlug(order.serviceSlug);

  if (!service) {
    throw new Error(`Missing service for order: ${order.serviceSlug}`);
  }

  return {
    ...order,
    service,
    subtotal: calculateConfiguredPrice(service.startingPrice, order.selectedOptions) * order.quantity,
  };
}

export function calculateConfiguredPrice(basePrice: number, selectedOptions: CartLineItem["selectedOptions"]) {
  return selectedOptions.reduce((total, option) => total + option.priceModifier, basePrice);
}

export function calculateOrderTotals(subtotal: number) {
  const serviceFee = Number((subtotal * 0.055).toFixed(2));
  const discount = subtotal > 100 ? 10 : 0;
  const taxes = 0;
  const total = Number((subtotal + serviceFee + taxes - discount).toFixed(2));

  return { subtotal, serviceFee, discount, taxes, total };
}
