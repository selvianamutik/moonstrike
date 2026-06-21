"use client";

import { useEffect } from "react";

export function useUnreadDocumentTitle(unreadCount: number, baseTitle: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = unreadCount > 0 ? `(${unreadCount > 99 ? "99+" : unreadCount}) ${baseTitle}` : baseTitle;

    return () => {
      document.title = previousTitle;
    };
  }, [baseTitle, unreadCount]);
}
