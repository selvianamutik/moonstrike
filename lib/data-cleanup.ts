import { CMS_MEDIA_BUCKET, getStoragePathFromPublicUrl } from "@/lib/cms/storage";
import { cleanupReadNotifications } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_ANONYMOUS_CART_MAX_AGE_SECONDS = 60 * 60;
const DEFAULT_EMPTY_CART_RETENTION_HOURS = 24;
const DEFAULT_CHECKOUT_SESSION_RETENTION_HOURS = 24;
const DEFAULT_NOTIFICATION_RETENTION_DAYS = 30;
const MEDIA_PREFIXES = ["games", "services", "cms", "admins", "chat"];
const STORAGE_PLACEHOLDER_NAMES = new Set([".emptyFolderPlaceholder"]);

type CleanupOptions = {
  anonymousCartMaxAgeSeconds?: number;
  emptyCartRetentionHours?: number;
  checkoutSessionRetentionHours?: number;
  notificationRetentionDays?: number;
  mediaMode?: "skip" | "dry-run" | "delete";
  mediaMinAgeHours?: number;
  maxMediaCandidates?: number;
};

type StorageFile = {
  path: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type CartRow = {
  id: string;
  user_id: string | null;
  session_id: string | null;
  updated_at: string;
};

type CheckoutSessionRow = {
  id: string;
  cart_id: string;
  status: string;
  created_at: string;
  fulfilled_at: string | null;
};

function safePositiveNumber(value: number | undefined, fallback: number) {
  return Number.isFinite(value) && Number(value) > 0 ? Number(value) : fallback;
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function secondsAgo(seconds: number) {
  return new Date(Date.now() - seconds * 1000).toISOString();
}

function chunk<T>(items: T[], size = 200) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function deleteByIds(table: string, ids: string[]) {
  if (ids.length === 0) return 0;

  const supabase = createAdminClient();
  let deletedCount = 0;

  for (const idsChunk of chunk(ids)) {
    const { data, error } = await supabase.from(table).delete().in("id", idsChunk).select("id");
    if (error) throw error;
    deletedCount += data?.length ?? 0;
  }

  return deletedCount;
}

async function idsWithRows(table: string, column: string, ids: string[]) {
  if (ids.length === 0) return new Set<string>();

  const supabase = createAdminClient();
  const result = new Set<string>();

  for (const idsChunk of chunk(ids)) {
    const { data, error } = await supabase.from(table).select(column).in(column, idsChunk);
    if (error) throw error;
    for (const row of data ?? []) {
      const value = (row as unknown as Record<string, unknown>)[column];
      if (typeof value === "string") result.add(value);
    }
  }

  return result;
}

async function cleanupAbandonedCheckoutSessions(retentionHours: number) {
  const supabase = createAdminClient();
  const expiresBefore = hoursAgo(retentionHours);

  const { data, error } = await supabase
    .from("checkout_sessions")
    .select("id, cart_id, status, created_at, fulfilled_at")
    .is("fulfilled_at", null)
    .lte("created_at", expiresBefore)
    .returns<CheckoutSessionRow[]>();

  if (error) throw error;

  const candidates = data ?? [];
  const candidateIds = candidates.map((session) => session.id);
  const orderSessionIds = await idsWithRows("orders", "checkout_session_id", candidateIds);
  const transactionSessionIds = await idsWithRows("transactions", "checkout_session_id", candidateIds);
  const deletableIds = candidateIds.filter((id) => !orderSessionIds.has(id) && !transactionSessionIds.has(id));

  return {
    deletedCount: await deleteByIds("checkout_sessions", deletableIds),
    scannedCount: candidates.length,
    skippedLinkedCount: candidateIds.length - deletableIds.length,
    expiresBefore,
    retentionHours,
  };
}

async function countCartItems(cartIds: string[]) {
  if (cartIds.length === 0) return 0;

  const supabase = createAdminClient();
  let count = 0;

  for (const idsChunk of chunk(cartIds)) {
    const { count: chunkCount, error } = await supabase.from("cart_items").select("id", { count: "exact", head: true }).in("cart_id", idsChunk);
    if (error) throw error;
    count += chunkCount ?? 0;
  }

  return count;
}

async function cartIdsWithItems(cartIds: string[]) {
  if (cartIds.length === 0) return new Set<string>();

  const supabase = createAdminClient();
  const result = new Set<string>();

  for (const idsChunk of chunk(cartIds)) {
    const { data, error } = await supabase.from("cart_items").select("cart_id").in("cart_id", idsChunk);
    if (error) throw error;
    for (const row of data ?? []) {
      if (typeof row.cart_id === "string") result.add(row.cart_id);
    }
  }

  return result;
}

async function cleanupCarts({
  anonymousCartMaxAgeSeconds,
  emptyCartRetentionHours,
}: {
  anonymousCartMaxAgeSeconds: number;
  emptyCartRetentionHours: number;
}) {
  const supabase = createAdminClient();
  const anonymousExpiresBefore = secondsAgo(anonymousCartMaxAgeSeconds);
  const emptyExpiresBefore = hoursAgo(emptyCartRetentionHours);

  const { data: anonymousCarts, error: anonymousError } = await supabase
    .from("carts")
    .select("id, user_id, session_id, updated_at")
    .is("user_id", null)
    .not("session_id", "is", null)
    .lte("updated_at", anonymousExpiresBefore)
    .returns<CartRow[]>();

  if (anonymousError) throw anonymousError;

  const anonymousCartIds = (anonymousCarts ?? []).map((cart) => cart.id);
  const checkoutCartIds = await idsWithRows("checkout_sessions", "cart_id", anonymousCartIds);
  const staleAnonymousCartIds = anonymousCartIds.filter((id) => !checkoutCartIds.has(id));
  const staleAnonymousCartItemCount = await countCartItems(staleAnonymousCartIds);
  const anonymousDeletedCount = await deleteByIds("carts", staleAnonymousCartIds);

  const { data: oldCarts, error: oldCartError } = await supabase
    .from("carts")
    .select("id, user_id, session_id, updated_at")
    .lte("updated_at", emptyExpiresBefore)
    .returns<CartRow[]>();

  if (oldCartError) throw oldCartError;

  const oldCartIds = (oldCarts ?? []).map((cart) => cart.id).filter((id) => !staleAnonymousCartIds.includes(id));
  const oldCartCheckoutIds = await idsWithRows("checkout_sessions", "cart_id", oldCartIds);
  const oldCartItemIds = await cartIdsWithItems(oldCartIds);
  const emptyCartIds = oldCartIds.filter((id) => !oldCartCheckoutIds.has(id) && !oldCartItemIds.has(id));
  const emptyDeletedCount = await deleteByIds("carts", emptyCartIds);

  return {
    anonymousDeletedCount,
    staleAnonymousCartItemCount,
    anonymousSkippedLinkedCheckoutCount: anonymousCartIds.length - staleAnonymousCartIds.length,
    emptyDeletedCount,
    anonymousExpiresBefore,
    emptyExpiresBefore,
    anonymousCartMaxAgeSeconds,
    emptyCartRetentionHours,
  };
}

function addStoragePath(paths: Set<string>, value: unknown) {
  if (typeof value !== "string" || value.length === 0) return;

  const fromUrl = getStoragePathFromPublicUrl(value);
  const path = fromUrl ?? value;
  if (MEDIA_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) paths.add(path);
}

function collectStoragePathsFromJson(paths: Set<string>, value: unknown) {
  if (!value) return;

  if (typeof value === "string") {
    addStoragePath(paths, value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectStoragePathsFromJson(paths, item));
    return;
  }

  if (typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((item) => collectStoragePathsFromJson(paths, item));
  }
}

async function collectReferencedMediaPaths() {
  const supabase = createAdminClient();
  const paths = new Set<string>();

  const [games, services, promoBanners, heroBanners, settings, contentBlocks, messages] = await Promise.all([
    supabase.from("games").select("image, hero_image"),
    supabase.from("services").select("image"),
    supabase.from("promo_banners").select("image"),
    supabase.from("hero_banners").select("image, thumbnail, storage_path, thumbnail_path"),
    supabase.from("system_settings").select("admin_avatar"),
    supabase.from("content_blocks").select("thumbnail, data"),
    supabase.from("messages").select("attachments"),
  ]);

  for (const result of [games, services, promoBanners, heroBanners, settings, contentBlocks, messages]) {
    if (result.error) throw result.error;
  }

  for (const row of games.data ?? []) {
    addStoragePath(paths, row.image);
    addStoragePath(paths, row.hero_image);
  }
  for (const row of services.data ?? []) addStoragePath(paths, row.image);
  for (const row of promoBanners.data ?? []) addStoragePath(paths, row.image);
  for (const row of heroBanners.data ?? []) {
    addStoragePath(paths, row.image);
    addStoragePath(paths, row.thumbnail);
    addStoragePath(paths, row.storage_path);
    addStoragePath(paths, row.thumbnail_path);
  }
  for (const row of settings.data ?? []) addStoragePath(paths, row.admin_avatar);
  for (const row of contentBlocks.data ?? []) {
    addStoragePath(paths, row.thumbnail);
    collectStoragePathsFromJson(paths, row.data);
  }
  for (const row of messages.data ?? []) collectStoragePathsFromJson(paths, row.attachments);

  return paths;
}

async function listStorageFiles(prefix: string) {
  const supabase = createAdminClient();
  const found: StorageFile[] = [];

  async function walk(folder: string) {
    let offset = 0;

    while (true) {
      const { data, error } = await supabase.storage.from(CMS_MEDIA_BUCKET).list(folder, {
        limit: 1000,
        offset,
        sortBy: { column: "name", order: "asc" },
      });

      if (error) throw error;
      if (!data || data.length === 0) break;

      for (const item of data) {
        const path = `${folder}/${item.name}`;
        if (item.id === null) {
          await walk(path);
        } else if (STORAGE_PLACEHOLDER_NAMES.has(item.name)) {
          continue;
        } else {
          found.push({
            path,
            createdAt: item.created_at ?? null,
            updatedAt: item.updated_at ?? null,
          });
        }
      }

      if (data.length < 1000) break;
      offset += data.length;
    }
  }

  await walk(prefix);
  return found;
}

function isOlderThan(file: StorageFile, cutoff: string) {
  const timestamp = file.updatedAt ?? file.createdAt;
  if (!timestamp) return false;
  return timestamp <= cutoff;
}

async function cleanupOrphanMedia({
  mode,
  minAgeHours,
  maxCandidates,
}: {
  mode: "dry-run" | "delete";
  minAgeHours: number;
  maxCandidates: number;
}) {
  const referencedPaths = await collectReferencedMediaPaths();
  const storedFileLists = await Promise.all(MEDIA_PREFIXES.map((prefix) => listStorageFiles(prefix).catch(() => [])));
  const storedFiles = storedFileLists.flat();
  const expiresBefore = hoursAgo(minAgeHours);
  const orphanCandidates = storedFiles.filter((file) => !referencedPaths.has(file.path));
  const eligibleCandidates = orphanCandidates.filter((file) => isOlderThan(file, expiresBefore));
  const eligiblePaths = eligibleCandidates.map((file) => file.path);
  const deletedPaths: string[] = [];
  const failedPaths: Array<{ path: string; error: string }> = [];

  if (mode === "delete" && eligiblePaths.length > 0) {
    const supabase = createAdminClient();

    for (const pathsChunk of chunk(eligiblePaths, 100)) {
      const { data, error } = await supabase.storage.from(CMS_MEDIA_BUCKET).remove(pathsChunk);
      if (error) {
        failedPaths.push(...pathsChunk.map((path) => ({ path, error: error.message })));
      } else {
        deletedPaths.push(...(data ?? []).map((item) => item.name).filter((path): path is string => typeof path === "string"));
      }
    }
  }

  return {
    mode,
    bucket: CMS_MEDIA_BUCKET,
    scannedCount: storedFiles.length,
    referencedCount: referencedPaths.size,
    orphanCandidateCount: orphanCandidates.length,
    eligibleCandidateCount: eligibleCandidates.length,
    deletedCount: deletedPaths.length,
    failedCount: failedPaths.length,
    orphanCandidates: orphanCandidates.slice(0, maxCandidates).map((file) => file.path),
    eligibleCandidates: eligibleCandidates.slice(0, maxCandidates).map((file) => file.path),
    deletedPaths: deletedPaths.slice(0, maxCandidates),
    failedPaths: failedPaths.slice(0, maxCandidates),
    expiresBefore,
    minAgeHours,
    maxCandidates,
  };
}

export async function cleanupOldData(options: CleanupOptions = {}) {
  const anonymousCartMaxAgeSeconds = safePositiveNumber(options.anonymousCartMaxAgeSeconds, DEFAULT_ANONYMOUS_CART_MAX_AGE_SECONDS);
  const emptyCartRetentionHours = safePositiveNumber(options.emptyCartRetentionHours, DEFAULT_EMPTY_CART_RETENTION_HOURS);
  const checkoutSessionRetentionHours = safePositiveNumber(options.checkoutSessionRetentionHours, DEFAULT_CHECKOUT_SESSION_RETENTION_HOURS);
  const notificationRetentionDays = safePositiveNumber(options.notificationRetentionDays, DEFAULT_NOTIFICATION_RETENTION_DAYS);
  const mediaMode = options.mediaMode ?? "skip";
  const mediaMinAgeHours = safePositiveNumber(options.mediaMinAgeHours, 24);
  const maxMediaCandidates = safePositiveNumber(options.maxMediaCandidates, 50);

  const checkoutSessions = await cleanupAbandonedCheckoutSessions(checkoutSessionRetentionHours);

  const [carts, notifications] = await Promise.all([
    cleanupCarts({ anonymousCartMaxAgeSeconds, emptyCartRetentionHours }),
    cleanupReadNotifications(notificationRetentionDays),
  ]);

  const media =
    mediaMode === "skip"
      ? { mode: "skipped" as const }
      : await cleanupOrphanMedia({
          mode: mediaMode,
          minAgeHours: mediaMinAgeHours,
          maxCandidates: maxMediaCandidates,
        });

  return {
    checkoutSessions,
    carts,
    notifications,
    media,
    deletedCount:
      checkoutSessions.deletedCount +
      carts.anonymousDeletedCount +
      carts.emptyDeletedCount +
      notifications.deletedCount +
      (media.mode === "delete" ? media.deletedCount : 0),
  };
}
