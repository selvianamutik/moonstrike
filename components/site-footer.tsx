import Link from "next/link";

const columns = [
  { title: "Sitemap", links: ["Instagram", "Youtube", "Tiktok", "X"] },
  { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Refund Policy"] },
  { title: "Genres", links: ["Action RPG", "tactical shooting", "MMORPG", "MOBA", "Sports Action", "Tactical Shooter"] },
  { title: "Social Media", links: ["Instagram", "Youtube", "Tiktok", "X"] },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--border)] bg-[var(--panel)] py-20 text-[var(--muted)]">
      <div className="ms-shell">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <Link href="/" className="text-6xl font-black tracking-[-0.06em] sm:text-7xl">
            <span className="brand-gradient">Moon Strike</span>
          </Link>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="mono text-sm font-bold text-[var(--muted)]">{column.title}</h3>
                <ul className="mt-4 space-y-3 mono text-xs">
                  {column.links.map((link) => (
                    <li key={link}>
                      {link === "Terms of Service" ? (
                        <Link href="/terms">{link}</Link>
                      ) : link === "Refund Policy" ? (
                        <Link href="/refund">{link}</Link>
                      ) : (
                        <span>{link}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-16 border-t border-[var(--border)] pt-8 text-sm leading-8">
          MoonStrike is not endorsed by, directly affiliated with, maintained, or sponsored by Blizzard Entertainment, Bungie,
          Electronic Arts, Grinding Gear Games, Activision Publishing, Square Enix Co., Valve, Battlestate Games,
          Wargaming.net Limited, Amazon Technologies, Jagex Limited, Riot Games, Smilegate RPG, Digital Extremes. Our
          service focuses on enhancing players' in-game skills and occasionally gifting in-game items to users.
        </p>
        <p className="mt-7 text-center text-sm">© 2024 Moon Strike. Dominate the Game.</p>
      </div>
    </footer>
  );
}
