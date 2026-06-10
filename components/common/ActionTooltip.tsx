"use client";

import { createPortal } from "react-dom";
import React, { useState } from "react";

type TooltipPosition = {
  left: number;
  top: number;
};

export function ActionTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  function showTooltip(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    setPosition({
      left: rect.left + rect.width / 2,
      top: rect.bottom + 8,
    });
  }

  function hideTooltip() {
    setPosition(null);
  }

  return (
    <>
      <span
        className="inline-flex"
        onMouseEnter={(event) => showTooltip(event.currentTarget)}
        onMouseLeave={hideTooltip}
        onFocus={(event) => showTooltip(event.currentTarget)}
        onBlur={hideTooltip}
      >
        {children}
      </span>
      {position
        ? createPortal(
            <span
              className="pointer-events-none fixed z-[100] rounded-md border border-[var(--ms-border)] bg-[var(--ms-bg-card)] px-2.5 py-2 text-xs font-semibold text-[var(--ms-heading)] shadow-[0_14px_36px_rgba(0,0,0,0.32)]"
              style={{
                left: position.left,
                top: position.top,
                transform: "translateX(-50%)",
              }}
            >
              {label}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}
