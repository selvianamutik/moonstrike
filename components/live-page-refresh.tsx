"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type LivePageRefreshProps = {
  enabled?: boolean;
  intervalMs?: number;
};

export function LivePageRefresh({ enabled = true, intervalMs = 10_000 }: LivePageRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    function refreshVisiblePage() {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }

    const intervalId = window.setInterval(refreshVisiblePage, intervalMs);
    window.addEventListener("focus", refreshVisiblePage);
    document.addEventListener("visibilitychange", refreshVisiblePage);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshVisiblePage);
      document.removeEventListener("visibilitychange", refreshVisiblePage);
    };
  }, [enabled, intervalMs, router]);

  return null;
}
