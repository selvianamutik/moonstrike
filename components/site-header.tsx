'use client';
import Image from "next/image";
import Link from "next/link";
import { QuickSelectMenu } from "@/components/quick-select-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { User, LogIn } from 'lucide-react';
import { useState, useEffect } from 'react';

export function SiteHeader() {
  // Logic Auth Dinamis dari Supabase
  const { user, loading } = useAuth();
  const isLoggedIn = !!user;

  // Logic Toggle Currency (USD/EUR) dengan persistensi LocalStorage
  const [currency, setCurrency] = useState<'USD' | 'EUR'>('USD');

  useEffect(() => {
    const saved = localStorage.getItem('ms_currency');
    if (saved === 'USD' || saved === 'EUR') {
      setCurrency(saved);
    }
  }, []);

  const toggleCurrency = () => {
    const next = currency === 'USD' ? 'EUR' : 'USD';
    setCurrency(next);
    localStorage.setItem('ms_currency', next);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--ms-border)] bg-[var(--ms-bg-navbar)]/95 backdrop-blur">
      <div className="ms-shell flex min-h-24 items-center gap-4 py-4">
        <Link href="/" className="font-display shrink-0 text-2xl font-black tracking-[-0.03em] sm:text-3xl">
          <span className="brand-gradient">Moon Strike</span>
        </Link>

        <QuickSelectMenu />

        <form className="hidden h-12 flex-1 items-center rounded-md border border-[var(--ms-border)] bg-[var(--ms-bg-card)] px-4 text-[var(--ms-body)] lg:flex">
          <label htmlFor="site-search" className="sr-only">
            Search services
          </label>
          <input
            id="site-search"
            type="search"
            placeholder="Search services"
            className="w-full bg-transparent mono text-sm outline-none"
          />
          <button type="submit" aria-label="Search" className="ms-focus-ring rounded p-1">
            <Image src="/assets/magnifien.png" alt="" width={22} height={22} />
          </button>
        </form>

        {/* Tombol USD / EUR Toggle */}
        <button 
          onClick={toggleCurrency}
          className="ms-button hidden h-11 px-4 mono text-xs uppercase tracking-[0.16em] md:inline-flex"
        >
          {currency === 'USD' ? '$ USD' : '€ EUR'}
        </button>

        <div className="hidden xl:block">
          <ThemeToggle />
        </div>

        <nav className="ml-auto flex items-center gap-4 text-sm font-semibold text-[var(--ms-heading)] sm:gap-6">
          {/* Tombol Services */}
          <Link href="/services" className="hidden text-center hover:text-[var(--ms-gradient-end)] sm:block">
            <span className="mono block text-xs text-[var(--ms-gradient-end)]">MENU</span>
            Services
          </Link>

          {/* Tombol About */}
          <a href="#about" className="hidden text-center hover:text-[var(--ms-gradient-end)] sm:block">
            <span className="mono block text-xs text-[var(--ms-gradient-end)]">INFO</span>
            About
          </a>
          
          {/* Kondisi State Profile / Login */}
          {loading ? (
            // Skeleton loader ketika session sedang dicek
            <div className="h-11 w-20 animate-pulse rounded bg-white/5 md:inline-flex hidden" />
          ) : isLoggedIn ? (
            // JIKA SUDAH LOGIN: Tampilkan SVG Logo Profile (Link ke /profile)
            <Link href="/profile" className="flex flex-col items-center hover:text-[var(--ms-gradient-end)]" aria-label="Profile">
              <span className="mono block text-xs text-[var(--ms-gradient-end)]">USER</span>
              <svg 
                className="w-6 h-6 mt-1 text-[var(--ms-heading)] hover:text-[var(--ms-gradient-end)] transition-colors" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          ) : (
            // JIKA BELUM LOGIN: Tampilkan Tombol Login (Link ke /login)
            <Link href="/login" className="ms-button hidden h-11 px-4 mono text-xs uppercase tracking-[0.16em] md:inline-flex">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}