"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faTiktok, faTwitter, faYoutube } from "@fortawesome/free-brands-svg-icons";

type LegalPage = { id: string; title: string; slug: string; category: string };

const socialLinks = [
  { label: "Instagram", href: "https://instagram.com", icon: faInstagram },
  { label: "Youtube", href: "https://youtube.com", icon: faYoutube },
  { label: "TikTok", href: "https://tiktok.com", icon: faTiktok },
  { label: "X (Twitter)", href: "https://x.com", icon: faTwitter },
];

function getPageHref(page: LegalPage) {
  if (page.category === "blog") return `/blog/${page.slug}`;
  if (page.category === "guide") return `/guide/${page.slug}`;
  return `/p/${page.slug}`;
}

export function SiteFooter() {
  const [legalPages, setLegalPages] = useState<LegalPage[]>([]);

  useEffect(() => {
    fetch("/api/public/pages?category=page", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setLegalPages(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  return (
    <footer className="mt-24 border-t border-[var(--ms-border)] bg-[var(--ms-bg-card)] py-20 text-[var(--ms-body)]">
      <div className="w-[80%] mx-auto">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Link href="/" className="font-display text-5xl font-black tracking-[-0.06em] sm:text-7xl">
              <img src={"/logo/logo.png"} width={600} />
            </Link>
            <p className="mt-5 max-w-xl text-lg leading-8">
              Dominate the Game. Premium boosting, coaching, progression, and item services for competitive players.
            </p>
            <div className="mt-8 flex items-center gap-4">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--ms-border)] text-[var(--ms-body)] transition-colors hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-gradient-end)] focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {Icon ? <FontAwesomeIcon width={18} icon={Icon} /> : null}
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 lg:gap-12 lg:grid-cols-3 lg:justify-self-end">
            <div>
              <h3 className="mono text-sm font-bold uppercase tracking-[0.2em] text-[var(--ms-heading)]">
                Sitemap
              </h3>
              <ul className="mt-4 space-y-3 mono text-xs">
                {[{ label: "Landing", href: "/" }, { label: "Games", href: "/games" }, { label: "Cart", href: "/cart" }].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="hover:text-[var(--ms-gradient-end)] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mono text-sm font-bold uppercase tracking-[0.2em] text-[var(--ms-heading)]">
                Pages
              </h3>
              <ul className="mt-4 space-y-3 mono text-xs">
                {legalPages.map((page) => (
                  <li key={page.id}>
                    <Link href={getPageHref(page)} className="hover:text-[var(--ms-gradient-end)] transition-colors">
                      {page.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-2 lg:col-span-1">
              <div className="rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-5">
                <h3 className="mono text-sm font-bold uppercase tracking-[0.2em] text-[var(--ms-heading)]">
                  Contact Us
                </h3>
                <div className="mt-4 space-y-3 text-sm">
                  <p className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    +1 (555) 123-4567
                  </p>
                  <p className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    support@moonstrike.io
                  </p>
                  <button
                    type="button"
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--ms-cta-bg)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_2px_8px_rgba(136,82,255,0.25)] transition-transform hover:translate-y-[-1px]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Chat us
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-16 border-t border-[var(--ms-border)] pt-8 text-sm leading-8">
          MoonStrike is not endorsed by, directly affiliated with, maintained, or sponsored by Blizzard Entertainment,
          Bungie, Electronic Arts, Grinding Gear Games, Activision Publishing, Square Enix Co., Valve, Battlestate
          Games, Wargaming.net Limited, Amazon Technologies, Jagex Limited, Riot Games, Smilegate RPG, or Digital
          Extremes. Our service focuses on enhancing players&apos; in-game skills and occasionally gifting in-game
          items to users.
        </p>
        <p className="mt-7 text-center mono text-xs uppercase tracking-[0.2em]">
          &copy; 2026 Moon Strike. Dominate the Game.
        </p>
      </div>
    </footer>
  );
}
