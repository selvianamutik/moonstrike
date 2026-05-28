/** Canonical values from MOONSTRIKE_AGENTS.md §10 */

export const CANONICAL_GAME_GENRES = [
  "ACTION RPG",
  "MMORPG",
  "FPS",
  "MOBA",
  "TACTICAL SHOOTER",
  "BATTLE ROYALE",
  "LOOTER SHOOTER",
  "SPORTS ACTION",
] as const;

export const GAME_PLATFORMS = ["PC", "Console", "Cross-play"] as const;

export const SERVICE_CATEGORIES = [
  "Dungeon",
  "Leveling",
  "Raid",
  "Stories",
  "Powerleveling",
  "Rank Boost",
  "Item Farm",
  "Coaching",
  "Placement Matches",
] as const;

export const SERVICE_BADGE_OPTIONS = [
  "Starts in < 15 mins",
  "100% Completion",
  "Safe & Secure",
  "24/7 Support",
] as const;

export const ORDER_FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "in_progress", label: "In Progress" },
  { id: "delivered", label: "Delivered" },
  { id: "completed", label: "Completed" },
  { id: "refund_requested", label: "Refund Requested" },
  { id: "refunded", label: "Refunded" },
] as const;

export type AdminOrderStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "delivered"
  | "completed"
  | "refund_requested"
  | "refunded";

export const ORDER_STATUS_LABELS: Record<AdminOrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  delivered: "Delivered",
  completed: "Completed",
  refund_requested: "Refund Requested",
  refunded: "Refunded",
};

/** Map catalog genre strings to canonical display genre */
export function toCanonicalGenre(genre: string, genreGroup: string): string {
  const g = genre.toLowerCase();
  if (g.includes("mmorpg") || genreGroup === "MMO") return "MMORPG";
  if (g.includes("moba")) return "MOBA";
  if (g.includes("tactical")) return "TACTICAL SHOOTER";
  if (g.includes("battle royale")) return "BATTLE ROYALE";
  if (g.includes("looter")) return "LOOTER SHOOTER";
  if (g.includes("fps") || g.includes("shooter")) return "FPS";
  if (g.includes("action rpg")) return "ACTION RPG";
  return genreGroup.toUpperCase() === "MMO" ? "MMORPG" : "ACTION RPG";
}

export function mapPlatform(platform: string): (typeof GAME_PLATFORMS)[number] {
  const p = platform.toLowerCase();
  if (p.includes("mobile")) return "Console";
  if (p.includes("cross")) return "Cross-play";
  return "PC";
}
