"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type LivePageRefreshProps = {
  enabled?: boolean;
  intervalMs?: number;
};

export function LivePageRefresh({ enabled = true, intervalMs = 10_000 }: LivePageRefreshProps) {
  const router = useRouter();
  const [isSuspended, setIsSuspended] = useState(false);

  useEffect(() => {
    function suspend() {
      setIsSuspended(true);
    }

    function resume() {
      setIsSuspended(false);
    }

    window.addEventListener("moonstrike:live-refresh-suspend", suspend);
    window.addEventListener("moonstrike:live-refresh-resume", resume);

    return () => {
      window.removeEventListener("moonstrike:live-refresh-suspend", suspend);
      window.removeEventListener("moonstrike:live-refresh-resume", resume);
    };
  }, []);

  useEffect(() => {
    if (!enabled || isSuspended) return;

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
  }, [enabled, intervalMs, isSuspended, router]);

  return null;
}
