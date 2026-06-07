import type { User } from "@supabase/supabase-js";

export function authProviders(user: Pick<User, "app_metadata" | "user_metadata">) {
  const providers = Array.isArray(user.app_metadata?.providers)
    ? user.app_metadata.providers.filter((provider): provider is string => typeof provider === "string")
    : [];

  if (hasEmailPassword(user) && !providers.includes("email")) {
    return [...providers, "email_password"];
  }

  return providers;
}

export function hasEmailPassword(user: Pick<User, "app_metadata" | "user_metadata">) {
  const providers = Array.isArray(user.app_metadata?.providers)
    ? user.app_metadata.providers
    : [];

  return (
    providers.includes("email") ||
    user.user_metadata?.has_email_password === true ||
    user.app_metadata?.has_email_password === true
  );
}
