"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "moonstrike-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    const nextTheme = savedTheme === "light" ? "light" : "dark";

    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  };

  return (
    <button
      type="button"
      aria-label="Toggle dark and light theme"
      aria-pressed={theme === "light"}
      onClick={toggleTheme}
      className="ms-focus-ring inline-flex h-11 items-center gap-2 rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)] px-3 mono text-xs font-bold uppercase tracking-[0.16em] text-[var(--ms-heading)]"
    >
      <span
        className={`h-5 w-5 rounded-full ${
          theme === "light" ? "bg-[var(--ms-lm-yellow-primary)]" : "bg-[var(--ms-gradient-end)]"
        }`}
      />
      {theme}
    </button>
  );
}
