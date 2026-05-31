"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type ScrollingTabItem = {
  href: string;
  key: string;
  label: string;
};

const TABS_PER_PAGE = 4;
const ANIM_DURATION = 240;

function tabClass(isActive: boolean) {
  return `inline-flex h-10 shrink-0 items-center justify-center rounded-full px-5 mono text-xs uppercase tracking-[0.22em] whitespace-nowrap ${
    isActive
      ? "ms-button"
      : "border border-[var(--ms-border)] bg-[var(--ms-bg-card)] text-[var(--ms-heading)] hover:border-[var(--ms-gradient-end)] hover:bg-[var(--ms-hover-bg)]"
  }`;
}

export function ScrollingTabList({
  activeKey,
  ariaLabel,
  fixedTabs,
  scrollingTabs,
}: {
  activeKey: string;
  ariaLabel: string;
  fixedTabs: ScrollingTabItem[];
  scrollingTabs: ScrollingTabItem[];
}) {
  const [startIndex, setStartIndex] = useState(0);
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const [phase, setPhase] = useState<"idle" | "exit" | "enter">("idle");
  const animatingRef = useRef(false);

  const canScroll = scrollingTabs.length > 1;
  const visibleTabs =
    scrollingTabs.length > 0
      ? Array.from({ length: TABS_PER_PAGE }, (_, index) => scrollingTabs[(displayedIndex + index) % scrollingTabs.length])
      : [];

  function navigate(nextDirection: "next" | "previous") {
    if (animatingRef.current || !canScroll) return;
    animatingRef.current = true;

    const nextIndex =
      nextDirection === "next"
        ? (startIndex + 1) % scrollingTabs.length
        : startIndex <= 0
        ? scrollingTabs.length - 1
        : startIndex - 1;

    setDirection(nextDirection);
    setStartIndex(nextIndex);
    setPhase("exit");
  }

  useEffect(() => {
    if (phase === "exit") {
      const timeoutId = window.setTimeout(() => {
        setDisplayedIndex(startIndex);
        setPhase("enter");
      }, ANIM_DURATION);
      return () => window.clearTimeout(timeoutId);
    }

    if (phase === "enter") {
      const timeoutId = window.setTimeout(() => {
        setPhase("idle");
        animatingRef.current = false;
      }, ANIM_DURATION);
      return () => window.clearTimeout(timeoutId);
    }
  }, [phase, startIndex]);

  const stripClass = (() => {
    if (phase === "exit") return direction === "next" ? "ms-genre-exit-next" : "ms-genre-exit-previous";
    if (phase === "enter") return direction === "next" ? "ms-genre-enter-next" : "ms-genre-enter-previous";
    return "";
  })();

  return (
    <div className="flex items-center justify-center gap-3" aria-label={ariaLabel}>
      {fixedTabs.map((tab) => (
        <Link key={tab.key} href={tab.href} className={tabClass(tab.key === activeKey)}>
          {tab.label}
        </Link>
      ))}

      <button
        type="button"
        aria-label={`Previous ${ariaLabel}`}
        disabled={!canScroll}
        onClick={() => navigate("previous")}
        className="h-10 w-10 shrink-0 rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)] text-xl text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        &lt;
      </button>

      <div
        className="relative h-10 min-w-0 flex-1"
        style={{
          maxWidth: 560,
          overflow: "hidden",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0px, black 20px, black calc(100% - 20px), transparent 100%)",
          maskImage:
            "linear-gradient(to right, transparent 0px, black 20px, black calc(100% - 20px), transparent 100%)",
        }}
      >
        <div className={`absolute inset-0 flex items-center justify-center gap-3 ${stripClass}`}>
          {visibleTabs.map((tab, index) => (
            <Link
              key={`${tab.key}-${displayedIndex}-${index}`}
              href={tab.href}
              className={tabClass(tab.key === activeKey)}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label={`Next ${ariaLabel}`}
        disabled={!canScroll}
        onClick={() => navigate("next")}
        className="h-10 w-10 shrink-0 rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)] text-xl text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        &gt;
      </button>
    </div>
  );
}
