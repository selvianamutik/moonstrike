"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AtSign, Eye, EyeOff, Lock, LogIn, Shield, ShieldCheck } from "lucide-react";
import { Turnstile } from "@/components/Turnstile";

const LOCKOUT_KEY = "ms_admin_login_lockout";

function saveLockout(lockedUntil: string) {
  try { localStorage.setItem(LOCKOUT_KEY, lockedUntil) } catch { /* ignore */ }
}

function clearLockout() {
  try { localStorage.removeItem(LOCKOUT_KEY) } catch { /* ignore */ }
}

function readLockout(): Date | null {
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    if (!raw) return null;
    const until = new Date(raw);
    if (until.getTime() <= Date.now()) { clearLockout(); return null; }
    return until;
  } catch { return null; }
}

export default function AdminLogin() {
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("admin@moonstrike.io");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Lazy initializer — reads localStorage immediately to avoid hydration gap
  const [lockedUntil, setLockedUntil] = useState<Date | null>(() => {
    if (typeof window === 'undefined') return null;
    const until = readLockout();
    return until && until.getTime() > Date.now() ? until : null;
  });
  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const until = readLockout();
    if (!until) return 0;
    const secsLeft = Math.ceil((until.getTime() - Date.now()) / 1000);
    return secsLeft > 0 ? secsLeft : 0;
  });

  // Restore lockout on mount (SSR fallback)
  useEffect(() => {
    const until = readLockout();
    if (!until) return;
    const secsLeft = Math.ceil((until.getTime() - Date.now()) / 1000);
    if (secsLeft > 0) {
      setLockedUntil(until);
      setLockoutSecondsLeft(secsLeft);
    }
  }, []);

  // Live countdown ticker
  useEffect(() => {
    if (lockoutSecondsLeft <= 0) {
      setLockedUntil(null);
      return;
    }
    const id = window.setTimeout(() => {
      setLockoutSecondsLeft((s) => Math.max(s - 1, 0));
    }, 1000);
    return () => window.clearTimeout(id);
  }, [lockoutSecondsLeft]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lockedUntil) return;
    if (!turnstileToken) {
      setError("Please complete the security verification.");
      return;
    }
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember, turnstileToken }),
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
        lockedUntil?: string;
      } | null;

      if (!response.ok) {
        // Handle lockout response (423 status)
        if (response.status === 423) {
          // Try to extract lockedUntil from response or compute from Retry-After header
          const retryAfter = response.headers.get("Retry-After");
          let until: Date | null = null;

          if (result?.lockedUntil) {
            until = new Date(result.lockedUntil);
          } else if (retryAfter) {
            until = new Date(Date.now() + Number(retryAfter) * 1000);
          } else {
            // Fallback: 30 minutes from now
            until = new Date(Date.now() + 30 * 60 * 1000);
          }

          if (until && until.getTime() > Date.now()) {
            saveLockout(until.toISOString());
            const secsLeft = Math.ceil((until.getTime() - Date.now()) / 1000);
            setLockedUntil(until);
            setLockoutSecondsLeft(secsLeft);
          }
        }

        setError(result?.error ?? "Admin login failed.");
        setTurnstileToken(null); // Reset token after failed attempt
        return;
      }

      clearLockout();
      window.location.href = searchParams.get("next") || "/admin/dashboard";
    } catch {
      setError("Unable to reach the admin login service.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const mm = Math.floor(lockoutSecondsLeft / 60).toString().padStart(2, "0");
  const ss = (lockoutSecondsLeft % 60).toString().padStart(2, "0");

  return (
    <div className="min-h-screen bg-[#050816] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[420px] rounded-2xl border border-[#8B5CF6]/30 bg-[#0F172A] p-8 shadow-[0_0_40px_rgba(139,92,246,0.15)]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white font-display">Moon Strike</h1>
          <p className="text-xs text-[#94A3B8] tracking-[0.3em] uppercase mt-1">Admin Terminal</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="flex items-center gap-2 text-sm text-[#94A3B8] mb-2">
              <AtSign size={14} className="text-[#22D3EE]" />
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={!!lockedUntil}
              className="w-full bg-[#050816] border border-[#172554] text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] placeholder-[#475569] disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="admin@moonstrike.io"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm text-[#94A3B8]">
                <Lock size={14} className="text-[#22D3EE]" />
                Password
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={!!lockedUntil}
                className="w-full bg-[#050816] border border-[#172554] text-white rounded-lg px-4 py-3 pr-12 text-sm outline-none focus:ring-1 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#22D3EE] hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-[#94A3B8] cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded border-[#172554] bg-[#050816] text-[#8B5CF6]"
            />
            Remember this terminal session
          </label>

          {/* Lockout banner — persists across refreshes via sessionStorage */}
          {lockedUntil && lockoutSecondsLeft > 0 ? (
            <div className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 px-4 py-4">
              <div className="flex items-start gap-3">
                <Lock size={15} className="mt-0.5 shrink-0 text-[#FCA5A5]" />
                <div>
                  <p className="text-sm font-bold text-[#FCA5A5]">Account temporarily locked</p>
                  <p className="mt-1 text-xs text-[#FCA5A5]/80">Too many failed attempts. Try again in:</p>
                  <p className="mt-2 text-xl font-black text-[#FCA5A5] font-mono">{mm}:{ss}</p>
                </div>
              </div>
            </div>
          ) : error ? (
            <p className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#FCA5A5]">
              {error}
            </p>
          ) : null}

          <div className="flex justify-center mb-4">
            <Turnstile
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => setTurnstileToken(null)}
              onExpire={() => setTurnstileToken(null)}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !!lockedUntil || !turnstileToken}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg bg-[#8B5CF6] text-white font-bold text-sm hover:bg-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-70 transition-colors shadow-[0_0_20px_rgba(139,92,246,0.4)]"
          >
            {isSubmitting ? "Authenticating..." : lockedUntil ? `Locked — ${mm}:${ss}` : "Enter Terminal"}
            <LogIn size={18} />
          </button>
        </form>

        <div className="border-t border-[#172554] mt-8 pt-6 text-center text-sm text-[#94A3B8]">
          Need assistance?{" "}
          <button type="button" className="text-[#22D3EE] hover:underline">
            Contact System Admin
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6 mt-8 text-xs text-[#64748B]">
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-[#22D3EE]" />
          Admin Session
        </span>
        <span className="flex items-center gap-1.5">
          <Shield size={14} className="text-[#22D3EE]" />
          SSL Encrypted
        </span>
      </div>
    </div>
  );
}

