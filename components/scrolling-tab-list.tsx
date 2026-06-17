"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";

export type ScrollingTabItem = {
  href?: string;
  key: string;
  label: string;
  onClick?: () => void;
};

function tabClass(isActive: boolean) {
  return `inline-flex h-10 shrink-0 items-center justify-center rounded-full px-5 mono text-xs uppercase tracking-[0.22em] whitespace-nowrap snap-center ${
    isActive
      ? "ms-button"
      : "border border-[var(--ms-border)] bg-[var(--ms-bg-card)] text-[var(--ms-heading)] hover:border-[var(--ms-gradient-end)] hover:bg-[var(--ms-hover-bg)]"
  }`;
}

const SCROLL_AMOUNT = 200;

function TabItem({ item, isActive }: { item: ScrollingTabItem; isActive: boolean }) {
  const cls = tabClass(isActive);
  if (item.href) {
    return <Link href={item.href} className={cls} draggable={false}>{item.label}</Link>;
  }
  return <button type="button" onClick={item.onClick} className={cls} draggable={false}>{item.label}</button>;
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const scroll = useCallback((direction: "previous" | "next") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === "next" ? SCROLL_AMOUNT : -SCROLL_AMOUNT;
    el.scrollBy({ left: amount, behavior: "smooth" });
  }, []);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeKey]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const container = el;

    function onMouseDown(e: MouseEvent) {
      isDragging.current = true;
      startX.current = e.pageX - container.offsetLeft;
      scrollLeft.current = container.scrollLeft;
      container.style.cursor = "grabbing";
    }

    function onMouseUp() {
      isDragging.current = false;
      container.style.cursor = "";
    }

    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX.current) * 1.5;
      container.scrollLeft = scrollLeft.current - walk;
    }

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseUp);

    return () => {
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseUp);
    };
  }, []);

  return (
    <div className="flex items-center justify-center gap-3" aria-label={ariaLabel}>
      {fixedTabs.map((tab) => (
        <TabItem key={tab.key} item={tab} isActive={tab.key === activeKey} />
      ))}

      <button
        type="button"
        aria-label={`Previous ${ariaLabel}`}
        onClick={() => scroll("previous")}
        className="h-10 w-10 shrink-0 cursor-pointer rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)] text-xl text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)]"
      >
        &lt;
      </button>

      <div
        ref={scrollRef}
        className="h-10 min-w-0 flex-1 overflow-x-auto scroll-smooth select-none"
        style={{
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          cursor: "grab",
        }}
      >
        <div className="flex items-center gap-3 px-2">
          {scrollingTabs.map((tab) => (
            <div key={tab.key} ref={tab.key === activeKey ? activeRef : undefined}>
              <TabItem item={tab} isActive={tab.key === activeKey} />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label={`Next ${ariaLabel}`}
        onClick={() => scroll("next")}
        className="h-10 w-10 shrink-0 cursor-pointer rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)] text-xl text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)]"
      >
        &gt;
      </button>
    </div>
  );
}