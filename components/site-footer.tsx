"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faTiktok, faTwitter, faYoutube, faFacebook, faDiscord, faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope, faPhone } from "@fortawesome/free-solid-svg-icons";

type LegalPage = { id: string; title: string; slug: string; category: string };
type SocialLink = { platform: string; url: string; display_order: number };

const iconMap: Record<string, any> = {
  instagram: faInstagram,
  youtube: faYoutube,
  tiktok: faTiktok,
  twitter: faTwitter,
  facebook: faFacebook,
  discord: faDiscord,
  whatsapp: faWhatsapp,
};

const labelMap: Record<string, string> = {
  instagram: "Instagram",
  youtube: "Youtube",
  tiktok: "TikTok",
  twitter: "X (Twitter)",
  facebook: "Facebook",
  discord: "Discord",
  whatsapp: "WhatsApp",
};

function getPageHref(page: LegalPage) {
  if (page.category === "blog") return `/blog/${page.slug}`;
  if (page.category === "guide") return `/guide/${page.slug}`;
  return `/p/${page.slug}`;
}

export function SiteFooter() {
  const [legalPages, setLegalPages] = useState<LegalPage[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [phone, setPhone] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/public/pages?category=page", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setLegalPages(Array.isArray(data) ? data : []))
      .catch(() => {});

    fetch("/api/public/social-links", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const links = Array.isArray(data) ? data : [];
        setSocialLinks(links.filter((link: SocialLink) => link.platform !== "phone" && link.platform !== "email"));
        const phoneEntry = links.find((link: SocialLink) => link.platform === "phone");
        const emailEntry = links.find((link: SocialLink) => link.platform === "email");
        setPhone(phoneEntry?.url || null);
        setEmail(emailEntry?.url || null);
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="mt-24 border-t border-[var(--ms-border)] bg-[var(--ms-bg-card)] py-20 text-[var(--ms-body)]">
      <div className="w-full px-4 sm:px-8 mx-auto max-w-7xl">
        <div className="grid gap-10 sm:gap-12 grid-cols-1 lg:grid-cols-[1fr_auto]">
          <div className="flex flex-col items-start">
            <Link href="/" className="font-display text-5xl font-black tracking-[-0.06em] sm:text-7xl">
              <img src={"/logo/logo.png"} className="w-[220px] sm:w-[320px] md:w-[420px] max-w-full" />
            </Link>
            <p className="mt-5 max-w-xl text-lg leading-8">
              Dominate the Game. Premium boosting, coaching, progression, and item services for competitive players.
            </p>
            {socialLinks.length > 0 && (
              <div className="mt-8 flex items-center gap-4">
                {socialLinks.map(({ platform, url }) => {
                  const icon = iconMap[platform];
                  const label = labelMap[platform] || platform;
                  if (!icon) return null;
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--ms-border)] text-[var(--ms-body)] transition-colors hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-gradient-end)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ms-gradient-end)]"
                    >
                      <FontAwesomeIcon icon={icon} className="text-lg" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8 lg:gap-12 lg:grid-cols-2 lg:justify-self-end">
            <div className="flex gap-16">
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
            </div>
            <div className="col-span-2 lg:col-span-1">
              <div className="rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-5">
                <h3 className="mono text-sm font-bold uppercase tracking-[0.2em] text-[var(--ms-heading)]">
                  Contact Us
                </h3>
                <div className="mt-4 space-y-3 text-sm">
                  {phone && (
                    <p className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faPhone} className="h-4 w-4" />
                      <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="hover:text-[var(--ms-gradient-end)] transition-colors">
                        {phone}
                      </a>
                    </p>
                  )}
                  {email && (
                    <p className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faEnvelope} className="h-4 w-4" />
                      <a href={`mailto:${email}`} className="hover:text-[var(--ms-gradient-end)] transition-colors">
                        {email}
                      </a>
                    </p>
                  )}
                  {phone && (
                    <a
                      href={`https://wa.me/${phone.replace(/[^+\d]/g, "").replace(/^\+/, "")}?text=${encodeURIComponent("Hi, I have a question about MoonStrike services.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--ms-border)] px-4 py-2.5 text-sm font-bold text-[var(--ms-heading)] transition-colors hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-gradient-end)]"
                    >
                      <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4" />
                      Chat us
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-10 border-t border-[var(--ms-border)] pt-8 text-sm leading-8 sm:mt-16">
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
