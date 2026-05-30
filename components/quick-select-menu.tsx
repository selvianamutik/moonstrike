"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CategoryTabs } from "@/components/ui";

const categories = [
  { label: "All Games", href: "/games" },
  { label: "Action RPG", href: "/games" },
  { label: "Tactical Shooting", href: "/games" },
  { label: "Looter Shooting", href: "/games" },
];

const serviceColumns = [
  {
    title: "Rank Boost",
    items: [
      { label: "Valorant Placement", href: "/valorant/valorant-rank-boost" },
      { label: "Mobile Legends Rank", href: "/mobile-legends/mobile-legends-rank" },
      { label: "Apex Coaching", href: "/apex-legends/apex-legends-coaching" },
    ],
  },
  {
    title: "Dungeons",
    items: [
      { label: "Mythic+ Dungeons", href: "/world-of-warcraft/wow-mythic-plus" },
      { label: "Timed Keystone Runs", href: "/world-of-warcraft/wow-mythic-plus" },
      { label: "Loot Trader Runs", href: "/world-of-warcraft/wow-mythic-plus" },
    ],
  },
  {
    title: "Raids",
    items: [
      { label: "Destiny 2 Raid Clear", href: "/destiny-2/destiny-2-raid-clear" },
      { label: "Flawless Trials", href: "/destiny-2/destiny-2-raid-clear" },
      { label: "Pinnacle Progression", href: "/destiny-2/destiny-2-raid-clear" },
    ],
  },
  {
    title: "Item Farm",
    items: [
      { label: "Rare Item Farming", href: "/world-of-warcraft/rare-item-farming" },
      { label: "Event Cosmetics", href: "/world-of-warcraft/rare-item-farming" },
      { label: "Targeted Drop Runs", href: "/world-of-warcraft/rare-item-farming" },
    ],
  },
];

export function QuickSelectMenu() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="quick-select-overlay"
        onClick={() => setIsOpen((value) => !value)}
        className="ms-focus-ring h-12 w-12 shrink-0 rounded-md border border-[var(--ms-border)] bg-[var(--ms-bg-card)] hover:border-[var(--ms-gradient-end)]"
      >
        <Image src="/assets/bar-menu.png" alt="Open quick select" width={26} height={26} className="mx-auto" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 px-4 py-6 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <section
            id="quick-select-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Quick service select"
            className="mx-auto max-w-5xl rounded-lg border border-[var(--ms-gradient-end)] bg-[var(--ms-bg-card)] p-5 text-[var(--ms-heading)] shadow-[0_0_0_1px_rgba(34,211,238,0.45),0_28px_90px_rgba(0,0,0,0.55)]"
            onClick={(event) => event.stopPropagation()}
          >
            <form className="mx-auto flex h-12 max-w-xl items-center rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] pl-5 text-[var(--ms-body)]">
              <label htmlFor="quick-select-search" className="sr-only">
                Search game or service
              </label>
              <input
                id="quick-select-search"
                type="search"
                placeholder="Search Game or Service"
                className="w-full bg-transparent mono text-sm tracking-[0.08em] outline-none"
              />
              <button className="ms-button ml-auto h-11 w-12 rounded-md" type="submit" aria-label="Search">
                <Image src="/assets/magnifien.png" alt="" width={22} height={22} />
              </button>
            </form>

            <div className="mt-6 border-t border-[var(--ms-border)] pt-7">
              <CategoryTabs items={categories} />
            </div>

            <div className="grid gap-x-12 gap-y-10 px-2 pb-8 pt-12 sm:grid-cols-2 lg:grid-cols-4">
              {serviceColumns.map((column) => (
                <div key={column.title}>
                  <h3 className="mono border-b border-[var(--ms-border)] pb-2 text-xl font-bold uppercase tracking-[0.08em] text-[var(--ms-heading)]">
                    {column.title}
                  </h3>
                  <ul className="mt-4 space-y-3 text-sm text-[var(--ms-body)]">
                    {column.items.map((item) => (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className="hover:text-[var(--ms-gradient-end)]"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
