"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const categories = ["All Games", "Action RPG", "Tactical Shooting", "Looter Shooting"];

const serviceColumns = [
  { title: "Service 1", items: ["Service 1.1", "Service 1.2", "Service 1.3"] },
  { title: "Service 2", items: ["Service 2.1", "Service 2.2", "Service 2.3", "Service 2.4", "Service 2.5"] },
  { title: "Service 3", items: ["Service 3.1"] },
  { title: "Service 4", items: ["Service 4.1", "Service 4.2", "Service 4.3", "Service 4.4"] },
  { title: "Service 5", items: ["Service 5.1", "Service 5.2"] },
  { title: "Service 6", items: ["Service 6.1", "Service 6.2", "Service 6.3"] },
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
        className="hidden h-13 w-14 rounded-md border border-[var(--border)] bg-[var(--panel)] md:block"
      >
        <Image src="/assets/bar-menu.png" alt="Open quick select" width={26} height={26} className="mx-auto" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/55 px-4 py-6 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <section
            id="quick-select-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Quick service select"
            className="mx-auto max-w-[913px] rounded border border-[var(--primary)] bg-[#0d0d22] p-5 text-white shadow-[0_0_0_1px_rgba(51,217,255,0.7),0_28px_90px_rgba(0,0,0,0.55)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto flex h-12 max-w-[496px] items-center rounded-md border border-[var(--border)] bg-[var(--field)] pl-5 text-[var(--muted)]">
              <span className="mono text-sm tracking-[0.08em]">Search Game or Service</span>
              <button className="ms-button ml-auto h-11 w-12 rounded-md" type="button">
                <Image src="/assets/magnifien.png" alt="Search" width={22} height={22} />
              </button>
            </div>

            <div className="mt-6 border-t border-[#302e68] pt-7">
              <div className="flex flex-wrap items-center justify-center gap-5">
                <button type="button" className="h-10 w-10 rounded-full bg-[#2b2a52] text-3xl leading-none">
                  ←
                </button>
                {categories.map((category, index) => (
                  <Link
                    key={category}
                    href="/games"
                    onClick={() => setIsOpen(false)}
                    className={`h-9 rounded px-4 pt-2 mono text-sm uppercase tracking-[0.18em] ${
                      index === 0 ? "ms-button" : "border border-[var(--border)] bg-[var(--panel)]"
                    }`}
                  >
                    {category}
                  </Link>
                ))}
                <button type="button" className="h-10 w-10 rounded-full bg-[#2b2a52] text-3xl leading-none">
                  →
                </button>
              </div>
            </div>

            <div className="grid gap-x-14 gap-y-10 px-7 pb-12 pt-16 sm:grid-cols-2 lg:grid-cols-4">
              {serviceColumns.map((column) => (
                <div key={column.title}>
                  <h3 className="mono border-b border-[#302e68] pb-1 text-2xl font-bold text-[#a5a7c5]">
                    {column.title}
                  </h3>
                  <ul className="mt-4 space-y-3 mono text-base text-[#7371aa]">
                    {column.items.map((item) => (
                      <li key={item}>
                        <Link href="/games" onClick={() => setIsOpen(false)} className="hover:text-[var(--accent)]">
                          {item}
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
