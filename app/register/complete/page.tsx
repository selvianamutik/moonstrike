"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { authProviders, hasEmailPassword } from "@/lib/auth/providers";

function getSafeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/profile";
  return value;
}

function PasswordToggle({
  shown,
  onToggle,
  label,
}: {
  shown: boolean;
  onToggle: () => void;
  label: string;
}) {
  const Icon = shown ? EyeOff : Eye;

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onToggle}
      className="ms-focus-ring ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--ms-body)] hover:text-[var(--ms-heading)]"
    >
      <Icon aria-hidden="true" size={18} strokeWidth={2} />
    </button>
  );
}

function CompleteGoogleRegistrationCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = useMemo(() => getSafeNext(searchParams.get("next")), [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return;

      const user = data.user;
      if (!user) {
        router.replace(`/login?tab=register&next=${encodeURIComponent(next)}`);
        return;
      }

      const providers = authProviders(user);
      if (!providers.includes("google")) {
        router.replace(next);
        return;
      }

      if (hasEmailPassword(user)) {
        router.replace(next);
        return;
      }

      setEmail(user.email ?? "");
      setIsChecking(false);
    });

    return () => {
      isMounted = false;
    };
  }, [next, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { has_email_password: true },
    });

    if (updateError) {
      const passwordAlreadyExists = updateError.message.toLowerCase().includes("different from the old password");

      if (!passwordAlreadyExists) {
        setIsSubmitting(false);
        setError(updateError.message);
        return;
      }

      const { error: metadataError } = await supabase.auth.updateUser({
        data: { has_email_password: true },
      });

      if (metadataError) {
        setIsSubmitting(false);
        setError(metadataError.message);
        return;
      }
    }

    await supabase.auth.refreshSession();
    router.replace(next);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.2),transparent_28rem),var(--ms-bg-page)] px-5 py-16 text-[var(--ms-heading)]">
      <section className="ms-card w-full max-w-md rounded-xl p-8 shadow-[0_24px_90px_rgba(0,0,0,0.42)]">
        <Link href="/" className="font-display text-3xl font-black tracking-[-0.04em]">
          <span className="brand-gradient">Moon Strike</span>
        </Link>
        <p className="mono mt-3 text-xs uppercase tracking-[0.22em] text-[var(--ms-gradient-end)]">
          Complete registration
        </p>

        <h1 className="font-display mt-8 text-2xl font-black">Add Email Password</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--ms-body)]">
          Your Google email is verified. Add a password now so this account can also log in with email and password.
        </p>

        {isChecking ? (
          <p className="mono mt-8 rounded-md border border-[var(--ms-border)] bg-[var(--ms-hover-bg)] px-4 py-3 text-xs leading-5 text-[var(--ms-body)]">
            Checking Google registration...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8">
            {error && (
              <p className="mono mb-6 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs leading-5 text-red-400">
                {error}
              </p>
            )}

            <label className="mono text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]" htmlFor="google-email">
              Google Email
            </label>
            <input
              id="google-email"
              type="email"
              value={email}
              readOnly
              className="mt-2 h-13 w-full rounded-md border border-[var(--ms-border)] bg-[var(--ms-hover-bg)] px-4 text-[var(--ms-body)] outline-none"
            />

            <label className="mono mt-6 block text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]" htmlFor="google-password">
              Password
            </label>
            <div className="mt-2 flex h-13 items-center rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] px-4 focus-within:border-[var(--ms-gradient-end)]">
              <input
                id="google-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="min-w-0 flex-1 bg-transparent outline-none"
              />
              <PasswordToggle
                shown={showPassword}
                onToggle={() => setShowPassword((current) => !current)}
                label={showPassword ? "Hide password" : "Show password"}
              />
            </div>

            <label className="mono mt-6 block text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]" htmlFor="google-confirm-password">
              Confirm Password
            </label>
            <div className="mt-2 flex h-13 items-center rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] px-4 focus-within:border-[var(--ms-gradient-end)]">
              <input
                id="google-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm password"
                className="min-w-0 flex-1 bg-transparent outline-none"
              />
              <PasswordToggle
                shown={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((current) => !current)}
                label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="ms-button mt-7 flex h-13 w-full items-center justify-center mono text-sm uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Complete Registration"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default function CompleteGoogleRegistrationPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[var(--ms-bg-page)]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ms-gradient-start)] border-t-transparent" />
        </main>
      }
    >
      <CompleteGoogleRegistrationCard />
    </Suspense>
  );
}
