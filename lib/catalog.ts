export type GameService = {
  slug: string;
  gameSlug: string;
  gameName: string;
  name: string;
  offerTitle?: string;
  category: string;
  serviceCategory: string;
  description: string;
  startingPrice: number;
  isHotOffer: boolean;
  tags: string[];
};

export type GameCatalogItem = {
  slug: string;
  name: string;
  genre: string;
  genreGroup: string;
  platform: string;
  description: string;
  image?: string;
  isTopTitle: boolean;
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

export const supportedGames: GameCatalogItem[] = [
  {
    slug: "world-of-warcraft",
    name: "World of Warcraft",
    genre: "MMORPG",
    genreGroup: "MMO",
    platform: "PC",
    description: "Dungeon, raid, leveling, and rare item services for Azeroth progression.",
    isTopTitle: true,
  },
  {
    slug: "destiny-2",
    name: "Destiny 2",
    genre: "Looter Shooter",
    genreGroup: "Shooters",
    platform: "Cross-play",
    description: "Raid clears, pinnacle progression, exotic farming, and flawless activities.",
    isTopTitle: true,
  },
  {
    slug: "valorant",
    name: "Valorant",
    genre: "Tactical Shooter",
    genreGroup: "Shooters",
    platform: "PC",
    description: "Rank boost, placement support, duo queue, and competitive climb services.",
    isTopTitle: true,
  },
  {
    slug: "league-of-legends",
    name: "League of Legends",
    genre: "MOBA",
    genreGroup: "MOBA",
    platform: "PC",
    description: "Ranked climb support, placement matches, coaching, and seasonal progression.",
    isTopTitle: true,
  },
  {
    slug: "mobile-legends",
    name: "Mobile Legends",
    genre: "Mobile MOBA",
    genreGroup: "MOBA",
    platform: "Mobile",
    description: "Reliable rank progression for players who need fast queue support.",
    isTopTitle: true,
  },
  {
    slug: "apex-legends",
    name: "Apex Legends",
    genre: "Battle Royale",
    genreGroup: "Shooters",
    platform: "Cross-play",
    description: "Coaching, mechanics review, ranked strategy, and legend-specific guidance.",
    isTopTitle: false,
  },
  {
    slug: "path-of-exile",
    name: "Path of Exile",
    genre: "Action RPG",
    genreGroup: "Action RPG",
    platform: "PC",
    description: "League start help, item farming, boss carries, and build progression.",
    isTopTitle: false,
  },
  {
    slug: "final-fantasy-xiv",
    name: "Final Fantasy XIV",
    genre: "MMORPG",
    genreGroup: "MMO",
    platform: "Cross-play",
    description: "Raid progression, story clears, relic farming, and endgame unlock support.",
    isTopTitle: false,
  },
  {
    slug: "the-finals",
    name: "The Finals",
    genre: "Arena Shooter",
    genreGroup: "Shooters",
    platform: "Cross-play",
    description: "Competitive coaching, ranked climb support, and team strategy sessions.",
    isTopTitle: false,
  },
];

export const gameServices: GameService[] = [
  {
    slug: "valorant-rank-boost",
    gameSlug: "valorant",
    gameName: "Valorant",
    name: "Valorant Rank Boost",
    offerTitle: "Ranked Placement",
    category: "Competitive FPS",
    serviceCategory: "Rank Boost",
    description: "Climb from your current rank to a target division with vetted high-MMR boosters.",
    startingPrice: 29,
    isHotOffer: true,
    tags: ["Rank boost", "Duo option", "Express"],
  },
  {
    slug: "destiny-2-raid-clear",
    gameSlug: "destiny-2",
    gameName: "Destiny 2",
    name: "Destiny 2 Raid Clear",
    offerTitle: "Flawless Trials",
    category: "Raid completion",
    serviceCategory: "Raid",
    description: "Book guided raid clears, exotic farming, and weekly pinnacle progression.",
    startingPrice: 39,
    isHotOffer: true,
    tags: ["Raid", "Loot", "Guided"],
  },
  {
    slug: "wow-mythic-plus",
    gameSlug: "world-of-warcraft",
    gameName: "World of Warcraft",
    name: "Mythic+ Dungeons Boost",
    offerTitle: "Mythic+ 15 Run",
    category: "MMO progression",
    serviceCategory: "Dungeon",
    description: "Secure timed dungeon runs with keystone level selection and loot preferences.",
    startingPrice: 24,
    isHotOffer: true,
    tags: ["Dungeon", "Timed", "Loot"],
  },
  {
    slug: "mobile-legends-rank",
    gameSlug: "mobile-legends",
    gameName: "Mobile Legends",
    name: "Mobile Legends Rank",
    offerTitle: "Leveling 1-70",
    category: "Mobile MOBA",
    serviceCategory: "Powerleveling",
    description: "Fast rank progression for busy players who need reliable win-rate support.",
    startingPrice: 19,
    isHotOffer: false,
    tags: ["Rank", "Mobile", "Fast queue"],
  },
  {
    slug: "apex-legends-coaching",
    gameSlug: "apex-legends",
    gameName: "Apex Legends",
    name: "Apex Legends Coaching",
    offerTitle: "Coaching Session",
    category: "Coaching",
    serviceCategory: "Coaching",
    description: "Mechanics review, ranked strategy, legend selection, and VOD feedback.",
    startingPrice: 35,
    isHotOffer: false,
    tags: ["Coaching", "VOD", "Ranked"],
  },
  {
    slug: "rare-item-farming",
    gameSlug: "world-of-warcraft",
    gameName: "World of Warcraft",
    name: "Rare Item Farming",
    offerTitle: "Rare Loot Farm",
    category: "Item service",
    serviceCategory: "Item Farm",
    description: "Targeted farming for rare drops, cosmetics, and event-limited rewards.",
    startingPrice: 45,
    isHotOffer: false,
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

export function getServiceByGameAndSlug(gameSlug: string, serviceSlug: string) {
  return gameServices.find((service) => service.gameSlug === gameSlug && service.slug === serviceSlug);
}

export function getServiceDetailHref(service: Pick<GameService, "gameSlug" | "slug">) {
  return `/${service.gameSlug}/${service.slug}`;
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

export function getProfileOrders() {
  return detailOrders.map((order) => {
    const service = getServiceBySlug(order.serviceSlug);

    if (!service) {
      throw new Error(`Missing service for order: ${order.serviceSlug}`);
    }

    return {
      ...order,
      service,
      subtotal: calculateConfiguredPrice(service.startingPrice, order.selectedOptions) * order.quantity,
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
