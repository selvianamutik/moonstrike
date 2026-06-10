import { createAdminClient } from "@/lib/supabase/admin";

export function isBanActive(bannedUntil: string | null | undefined) {
  return Boolean(bannedUntil && new Date(bannedUntil).getTime() > Date.now());
}

export async function getUserBanState(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);

  if (error || !data.user) {
    return { banned: false, bannedUntil: null };
  }

  const bannedUntil = data.user.banned_until ?? null;

  return {
    banned: isBanActive(bannedUntil),
    bannedUntil,
  };
}
