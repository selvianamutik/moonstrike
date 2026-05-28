import {
  supportedGames,
  gameServices,
  type GameCatalogItem,
  type GameService,
} from "@/lib/catalog";
import {
  type AdminOrderStatus,
  mapPlatform,
  toCanonicalGenre,
} from "@/lib/admin-constants";

export type AdminGameStatus = "active" | "draft" | "archived";
export type AdminServiceStatus = "active" | "draft" | "archived";
export type AdminUserRole = "ADMIN";
export type AdminUserStatus = "active" | "banned" | "pending";
export type TransactionStatus = "success" | "pending" | "disputed" | "refunded";
export type AuditLogStatus = "success" | "critical" | "blocked";
export type ContentStatus = "active" | "scheduled" | "draft";
export type ContentTab = "landing" | "banners" | "media";
export type ContentBlockType = "hero" | "stats_bar" | "benefits_section" | "steps_section";

export type AdminGame = GameCatalogItem & {
  id: string;
  status: AdminGameStatus;
  canonicalGenre: string;
  displayPlatform: string;
  serviceCount: number;
};

export type AdminService = GameService & {
  id: string;
  status: AdminServiceStatus;
  basePriceUsd: number;
  basePriceEur: number;
  isHotOffer: boolean;
  regions: ("USA" | "EUROPE")[];
  badges: string[];
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  lastLogin: string;
  avatarInitials: string;
};

export type CustomerProfile = {
  id: string;
  name: string;
  email: string;
  tag: string;
  location?: string;
  tier?: string;
  ordersCount: number;
  totalSpent: string;
  avatarInitials: string;
};

export type AdminTransaction = {
  id: string;
  orderId?: string;
  customerName: string;
  customerEmail: string;
  customerInitials: string;
  services: string[];
  date: string;
  amount: string;
  method: "Card" | "PayPal" | "Crypto";
  paymentProvider: "stripe" | "nowpayments";
  status: TransactionStatus;
  canRefund: boolean;
  refundBlockedReason?: string;
};

export type AdminOrder = {
  id: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  serviceSlug: string;
  optionsSummary: string;
  createdAt: string;
  amount: string;
  status: AdminOrderStatus;
  paymentProvider: "stripe" | "nowpayments";
  cryptoRefundAddress?: string;
  region: string;
  selectedOptions: Array<{ group: string; value: string; priceModifier: number }>;
  timeline: Array<{ status: AdminOrderStatus; at: string; note?: string }>;
};

export type AdminContent =
  | {
      id: string;
      tab: "landing";
      blockType: ContentBlockType;
      title: string;
      status: ContentStatus;
      modified: string;
    }
  | {
      id: string;
      tab: "banners";
      title: string;
      gameName?: string;
      status: ContentStatus;
      modified: string;
    }
  | {
      id: string;
      tab: "media";
      filename: string;
      status: ContentStatus;
      modified: string;
      usedIn: number;
    };

export type AuditLog = {
  id: string;
  timestamp: string;
  actorLabel: string;
  actorInitials: string;
  action: string;
  ip: string | null;
  status: AuditLogStatus;
};

export type SupportTicket = {
  id: string;
  threadType: "support" | "order";
  orderId?: string;
  customerId: string;
  userName: string;
  userTag: string;
  subject: string;
  preview: string;
  timeAgo: string;
  unread: boolean;
};

export type ChatMessage = {
  id: string;
  ticketId: string;
  sender: "user" | "admin";
  content: string;
  timestamp: string;
  attachment?: { name: string; size: string };
};

const gameStatuses: AdminGameStatus[] = ["active", "active", "active", "draft", "active", "active", "draft", "active", "archived"];

export const adminGames: AdminGame[] = supportedGames.map((game, i) => ({
  ...game,
  id: game.slug,
  status: gameStatuses[i] ?? "active",
  canonicalGenre: toCanonicalGenre(game.genre, game.genreGroup),
  displayPlatform: mapPlatform(game.platform),
  serviceCount: gameServices.filter((s) => s.gameSlug === game.slug).length,
}));

const serviceStatuses: AdminServiceStatus[] = ["active", "active", "active", "draft", "active", "archived"];

export const adminServices: AdminService[] = gameServices.map((service, i) => ({
  ...service,
  id: service.slug,
  status: serviceStatuses[i] ?? "active",
  basePriceUsd: service.startingPrice,
  basePriceEur: Math.round(service.startingPrice * 0.92),
  isHotOffer: service.isHotOffer,
  regions: ["USA", "EUROPE"],
  badges: service.isHotOffer ? ["Starts in < 15 mins", "100% Completion"] : ["Safe & Secure"],
}));

/** Admin terminal users — ADMIN role only (§10.4) */
export const adminUsers: AdminUser[] = [
  { id: "adm1", name: "Elena Stark", email: "elena@moonstrike.io", role: "ADMIN", status: "active", lastLogin: "2 hours ago", avatarInitials: "ES" },
  { id: "adm2", name: "Marcus Chen", email: "marcus@moonstrike.io", role: "ADMIN", status: "active", lastLogin: "5 hours ago", avatarInitials: "MC" },
  { id: "adm3", name: "Admin Alpha", email: "alpha@moonstrike.admin", role: "ADMIN", status: "active", lastLogin: "30 min ago", avatarInitials: "AA" },
];

export const customerProfiles: CustomerProfile[] = [
  { id: "c1", name: "Arthas King", email: "arthas@example.com", tag: "#8842", location: "Europe / London", tier: "GOLD TIER MEMBER", ordersCount: 24, totalSpent: "$1.2k", avatarInitials: "AK" },
  { id: "c2", name: "John Doe", email: "john@example.com", tag: "#1024", ordersCount: 8, totalSpent: "$890", avatarInitials: "JD" },
  { id: "c3", name: "Nova Pulse", email: "nova@example.com", tag: "#2204", ordersCount: 2, totalSpent: "$120", avatarInitials: "NP" },
];

export const adminOrders: AdminOrder[] = [
  {
    id: "MS-2401",
    customerName: "Arthas King",
    customerEmail: "arthas@example.com",
    serviceName: "Mythic+ Dungeons Boost",
    serviceSlug: "wow-mythic-plus",
    optionsSummary: "+15 · 1 run · Express",
    createdAt: "2026-05-17",
    amount: "$69.00",
    status: "in_progress",
    paymentProvider: "stripe",
    region: "USA",
    selectedOptions: [
      { group: "Key Level", value: "+15", priceModifier: 21 },
      { group: "Runs", value: "1", priceModifier: 0 },
    ],
    timeline: [
      { status: "pending", at: "May 17, 10:00" },
      { status: "confirmed", at: "May 17, 10:15" },
      { status: "in_progress", at: "May 17, 11:00" },
    ],
  },
  {
    id: "MS-2402",
    customerName: "John Doe",
    customerEmail: "john@example.com",
    serviceName: "Valorant Rank Boost",
    serviceSlug: "valorant-rank-boost",
    optionsSummary: "Gold II → Diamond I · Duo",
    createdAt: "2026-05-20",
    amount: "$107.00",
    status: "pending",
    paymentProvider: "stripe",
    region: "Europe",
    selectedOptions: [],
    timeline: [{ status: "pending", at: "May 20, 14:22" }],
  },
  {
    id: "MS-2403",
    customerName: "Nova Pulse",
    customerEmail: "nova@example.com",
    serviceName: "Destiny 2 Raid Clear",
    serviceSlug: "destiny-2-raid-clear",
    optionsSummary: "Standard clear",
    createdAt: "2026-05-22",
    amount: "$39.00",
    status: "delivered",
    paymentProvider: "nowpayments",
    region: "USA",
    selectedOptions: [],
    timeline: [
      { status: "pending", at: "May 22, 09:00" },
      { status: "confirmed", at: "May 22, 09:30" },
      { status: "in_progress", at: "May 22, 12:00" },
      { status: "delivered", at: "May 23, 18:00", note: "7-day refund window open" },
    ],
  },
  {
    id: "MS-2404",
    customerName: "Jane Smith",
    customerEmail: "jane@example.com",
    serviceName: "Valorant Rank Boost",
    serviceSlug: "valorant-rank-boost",
    optionsSummary: "Placement x5",
    createdAt: "2026-05-21",
    amount: "$85.00",
    status: "refund_requested",
    paymentProvider: "nowpayments",
    cryptoRefundAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    region: "USA",
    selectedOptions: [],
    timeline: [
      { status: "pending", at: "May 21, 08:00" },
      { status: "confirmed", at: "May 21, 08:20" },
      { status: "in_progress", at: "May 21, 10:00" },
      { status: "delivered", at: "May 22, 16:00" },
      { status: "refund_requested", at: "May 23, 09:00" },
    ],
  },
  {
    id: "MS-2405",
    customerName: "Alex Rivera",
    customerEmail: "alex@example.com",
    serviceName: "Apex Legends Coaching",
    serviceSlug: "apex-legends-coaching",
    optionsSummary: "VOD review · 2h",
    createdAt: "2026-05-10",
    amount: "$70.00",
    status: "completed",
    paymentProvider: "stripe",
    region: "USA",
    selectedOptions: [],
    timeline: [
      { status: "pending", at: "May 10, 12:00" },
      { status: "confirmed", at: "May 10, 12:30" },
      { status: "in_progress", at: "May 11, 09:00" },
      { status: "delivered", at: "May 12, 20:00" },
      { status: "completed", at: "May 19, 20:00" },
    ],
  },
  {
    id: "MS-2406",
    customerName: "Mia Chen",
    customerEmail: "mia@example.com",
    serviceName: "Mobile Legends Rank",
    serviceSlug: "mobile-legends-rank",
    optionsSummary: "Epic → Legend",
    createdAt: "2026-05-08",
    amount: "$45.00",
    status: "refunded",
    paymentProvider: "stripe",
    region: "Europe",
    selectedOptions: [],
    timeline: [
      { status: "pending", at: "May 8, 11:00" },
      { status: "refund_requested", at: "May 9, 14:00" },
      { status: "refunded", at: "May 10, 09:00" },
    ],
  },
];

export const adminTransactions: AdminTransaction[] = [
  {
    id: "#TXN-882190",
    orderId: "MS-2402",
    customerName: "John Doe",
    customerEmail: "john@example.com",
    customerInitials: "JD",
    services: ["Valorant Rank Boost"],
    date: "Nov 22, 2024",
    amount: "$450.00",
    method: "Card",
    paymentProvider: "stripe",
    status: "success",
    canRefund: true,
  },
  {
    id: "#TXN-882189",
    orderId: "MS-2401",
    customerName: "Arthas King",
    customerEmail: "arthas@example.com",
    customerInitials: "AK",
    services: ["Mythic+ Dungeons Boost"],
    date: "Nov 22, 2024",
    amount: "$69.00",
    method: "PayPal",
    paymentProvider: "stripe",
    status: "success",
    canRefund: true,
  },
  {
    id: "#TXN-882188",
    orderId: "MS-2404",
    customerName: "Jane Smith",
    customerEmail: "jane@example.com",
    customerInitials: "JS",
    services: ["Valorant Rank Boost"],
    date: "Nov 21, 2024",
    amount: "$85.00",
    method: "Crypto",
    paymentProvider: "nowpayments",
    status: "pending",
    canRefund: false,
    refundBlockedReason: "Awaiting wallet address",
  },
  {
    id: "#TXN-882187",
    orderId: "MS-2406",
    customerName: "Mia Chen",
    customerEmail: "mia@example.com",
    customerInitials: "MC",
    services: ["Mobile Legends Rank"],
    date: "Nov 21, 2024",
    amount: "$45.00",
    method: "Card",
    paymentProvider: "stripe",
    status: "refunded",
    canRefund: false,
  },
];

export const adminContent: AdminContent[] = [
  { id: "c1", tab: "landing", blockType: "hero", title: "Hero — Dominate the Game", status: "active", modified: "2 hours ago" },
  { id: "c2", tab: "landing", blockType: "stats_bar", title: "Trust Stats Bar", status: "active", modified: "1 day ago" },
  { id: "c3", tab: "landing", blockType: "benefits_section", title: "Why Choose Us", status: "draft", modified: "5 days ago" },
  { id: "c4", tab: "landing", blockType: "steps_section", title: "How It Works", status: "active", modified: "3 days ago" },
  { id: "c5", tab: "banners", title: "Valorant Season Launch", gameName: "Valorant", status: "scheduled", modified: "3 days ago" },
  { id: "c6", tab: "banners", title: "Global Default Banner", status: "active", modified: "1 week ago" },
  { id: "c7", tab: "media", filename: "hero-season-12.jpg", status: "active", modified: "2 days ago", usedIn: 2 },
  { id: "c8", tab: "media", filename: "wow-raid-thumb.png", status: "active", modified: "1 week ago", usedIn: 0 },
];

export const auditLogs: AuditLog[] = [
  { id: "l1", timestamp: "2024-05-24 14:22:15", actorLabel: "Elena Stark", actorInitials: "ES", action: "Admin Console Login", ip: "192.168.1.45", status: "success" },
  { id: "l2", timestamp: "2024-05-24 13:58:02", actorLabel: "System (Cron)", actorInitials: "SY", action: "Database connection timeout — auto-recovered", ip: null, status: "critical" },
  { id: "l3", timestamp: "2024-05-24 12:15:44", actorLabel: "Marcus Chen", actorInitials: "MC", action: "Modified permissions for valkyrie_77", ip: "192.168.1.12", status: "success" },
  { id: "l4", timestamp: "2024-05-24 11:02:33", actorLabel: "System (Webhook)", actorInitials: "SY", action: "Unauthorized API request blocked", ip: null, status: "blocked" },
  { id: "l5", timestamp: "2024-05-24 09:45:10", actorLabel: "Elena Stark", actorInitials: "ES", action: "Deployed service: Mythic+ 15 Run", ip: "192.168.1.22", status: "success" },
];

export const supportTickets: SupportTicket[] = [
  {
    id: "t1",
    threadType: "order",
    orderId: "MS-2401",
    customerId: "c1",
    userName: "Arthas King",
    userTag: "#8842",
    subject: "Rank boost delay",
    preview: "Hey, my booster hasn't started yet...",
    timeAgo: "2m ago",
    unread: true,
  },
  {
    id: "t2",
    threadType: "support",
    customerId: "c2",
    userName: "John Doe",
    userTag: "#1024",
    subject: "Account verification",
    preview: "I need help linking my Discord...",
    timeAgo: "15m ago",
    unread: false,
  },
  {
    id: "t3",
    threadType: "order",
    orderId: "MS-2404",
    customerId: "c2",
    userName: "Jane Smith",
    userTag: "#3301",
    subject: "Refund follow-up",
    preview: "Wallet address submitted, any update?",
    timeAgo: "1h ago",
    unread: true,
  },
];

export const chatMessages: ChatMessage[] = [
  { id: "m1", ticketId: "t1", sender: "user", content: "Hey, my booster hasn't started yet. Order MS-2401.", timestamp: "14:02" },
  { id: "m2", ticketId: "t1", sender: "admin", content: "Hi Arthas! Checking your order now — a booster will be assigned within the hour.", timestamp: "14:05" },
  { id: "m3", ticketId: "t1", sender: "user", content: "Thanks! Screenshot attached.", timestamp: "14:08", attachment: { name: "account_proof.png", size: "1.2 MB" } },
  { id: "m4", ticketId: "t1", sender: "admin", content: "Booster ShadowRunner assigned. You'll be notified when they start.", timestamp: "14:12" },
];

export function getAdminGameById(id: string) {
  return adminGames.find((g) => g.id === id || g.slug === id);
}

export function getAdminServiceById(id: string) {
  return adminServices.find((s) => s.id === id || s.slug === id);
}

export function getAdminUserById(id: string) {
  return adminUsers.find((u) => u.id === id);
}

export function getCustomerById(id: string) {
  return customerProfiles.find((c) => c.id === id);
}

export function getAdminOrderById(id: string) {
  return adminOrders.find((o) => o.id.toLowerCase() === id.toLowerCase());
}

export function getAdminContentById(id: string) {
  return adminContent.find((c) => c.id === id);
}

export function getTicketById(id: string) {
  return supportTickets.find((t) => t.id === id);
}

export function getMessagesForTicket(ticketId: string) {
  return chatMessages.filter((m) => m.ticketId === ticketId);
}

export const userStats = {
  totalUsers: adminUsers.length,
  activeOrders: adminOrders.filter((o) => ["pending", "confirmed", "in_progress"].includes(o.status)).length,
  pendingRefunds: adminOrders.filter((o) => o.status === "refund_requested").length,
  bannedFlagged: adminUsers.filter((u) => u.status === "banned").length,
};

export const transactionStats = {
  totalRevenue: "$124.5k",
  pendingPayouts: "$12k",
  successRate: "98.2%",
  newDisputes: 3,
};

export const gameStats = {
  totalGames: adminGames.filter((g) => g.status === "active").length,
  totalGenres: new Set(adminGames.map((g) => g.canonicalGenre)).size,
};

export const logStats = {
  uptime: "99.998%",
  blockedThreats: "142 Today",
  activeAnomalies: "2 Pending",
};

export function getNextOrderActions(status: AdminOrderStatus): Array<{ label: string; variant: "primary" | "danger" | "secondary"; next?: AdminOrderStatus }> {
  switch (status) {
    case "pending":
      return [{ label: "Confirm Order", variant: "primary", next: "confirmed" }];
    case "confirmed":
      return [{ label: "Mark as In Progress", variant: "primary", next: "in_progress" }];
    case "in_progress":
      return [{ label: "Mark as Delivered", variant: "primary", next: "delivered" }];
    case "refund_requested":
      return [
        { label: "Approve Refund", variant: "danger", next: "refunded" },
        { label: "Deny Refund", variant: "secondary", next: "completed" },
      ];
    default:
      return [];
  }
}
