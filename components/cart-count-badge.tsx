"use client";

import { useEffect, useState } from "react";

type CartPayload = {
  items?: unknown[];
};

export function CartCountBadge() {
  const [count, setCount] = useState(0);

  async function loadCount() {
    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as CartPayload;

      if (!response.ok) return;
      setCount(Array.isArray(payload.items) ? payload.items.length : 0);
    } catch {
      setCount(0);
    }
  }

  useEffect(() => {
    loadCount();

    window.addEventListener("focus", loadCount);
    window.addEventListener("moonstrike:cart-updated", loadCount);

    return () => {
      window.removeEventListener("focus", loadCount);
      window.removeEventListener("moonstrike:cart-updated", loadCount);
    };
  }, []);

  if (count <= 0) return null;

  return (
    <span className="absolute -right-3 -top-2 grid h-5 min-w-5 place-items-center rounded-full border border-[var(--ms-bg-page)] bg-[var(--ms-danger)] px-1 mono text-[10px] font-black leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
