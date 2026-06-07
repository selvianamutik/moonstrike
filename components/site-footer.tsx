import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faTiktok, faTwitter, faYoutube } from "@fortawesome/free-brands-svg-icons";

const columns = [
  {
    title: "Sitemap",
    links: [
      { label: "Landing", href: "/" },
      { label: "Games", href: "/games" },
      { label: "Cart", href: "/cart" },
    ],
  },
  {
    title: "Legal",
    links: [
      // { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms-of-service" },
      { label: "Refund Policy", href: "/refund-policy" },
    ],
  },
  {
    title: "Genres",
    links: [
      { label: "Action RPG", href: "/games" },
      { label: "Tactical Shooting", href: "/games" },
      { label: "MMORPG", href: "/games" },
      { label: "MOBA", href: "/games" },
    ],
  },
];

const socialLinks = [
  { label: "Instagram", href: "https://instagram.com", icon: faInstagram },
  { label: "Youtube", href: "https://youtube.com", icon: faYoutube },
  {
    label: "TikTok",
    href: "https://tiktok.com",
    icon: faTiktok,
  },
  { label: "X (Twitter)", href: "https://x.com", icon: faTwitter },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--ms-border)] bg-[var(--ms-bg-card)] py-20 text-[var(--ms-body)]">
      <div className="ms-shell">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <Link href="/" className="font-display text-5xl font-black tracking-[-0.06em] sm:text-7xl">
              <span className="brand-gradient">Moon Strike</span>
            </Link>
            <p className="mt-5 max-w-xl text-lg leading-8">
              Dominate the Game. Premium boosting, coaching, progression, and item services for competitive players.
            </p>

            {/* Social media icons */}
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

          <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="mono text-sm font-bold uppercase tracking-[0.2em] text-[var(--ms-heading)]">
                  {column.title}
                </h3>
                <ul className="mt-4 space-y-3 mono text-xs">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="hover:text-[var(--ms-gradient-end)] transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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
