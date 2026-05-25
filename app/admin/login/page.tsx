"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AtSign, Lock, LogIn, Eye, EyeOff, Shield, ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("admin@moonstrike.io");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/admin/dashboard");
  }

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
              className="w-full bg-[#050816] border border-[#172554] text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] placeholder-[#475569]"
              placeholder="admin@moonstrike.io"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm text-[#94A3B8]">
                <Lock size={14} className="text-[#22D3EE]" />
                Password
              </label>
              <button type="button" className="text-xs text-[#8B5CF6] hover:text-[#A78BFA]">
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#050816] border border-[#172554] text-white rounded-lg px-4 py-3 pr-12 text-sm outline-none focus:ring-1 focus:ring-[#8B5CF6] focus:border-[#8B5CF6]"
                placeholder="••••••••"
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
            <input type="checkbox" className="rounded border-[#172554] bg-[#050816] text-[#8B5CF6]" />
            Remember this terminal session
          </label>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg bg-[#8B5CF6] text-white font-bold text-sm hover:bg-[#7C3AED] transition-colors shadow-[0_0_20px_rgba(139,92,246,0.4)]"
          >
            Enter Terminal
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
          2FA Protected
        </span>
        <span className="flex items-center gap-1.5">
          <Shield size={14} className="text-[#22D3EE]" />
          SSL Encrypted
        </span>
      </div>
    </div>
  );
}
