"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "moonstrike-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    const nextTheme = savedTheme === "light" ? "light" : "dark";

    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  };

  if (!mounted) {
    return <div className="h-[38px] w-[68px]" />;
  }

  return (
    <button
      type="button"
      aria-label="Toggle dark and light theme"
      aria-pressed={theme === "light"}
      onClick={toggleTheme}
      className="relative flex h-[38px] w-[68px] items-center rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)] transition-all duration-300"
    >
      <span className="absolute left-0 flex w-full items-center justify-between px-2.5 text-[var(--ms-body)]">
        <Moon size={14} />
        <Sun size={14} />
      </span>
      <span
        className={`relative z-10 flex h-[30px] w-[30px] items-center justify-center rounded-full text-white shadow-md transition-transform duration-300 ${
          theme === "light" ? "translate-x-[34px] bg-[var(--ms-lm-yellow-primary)]" : "translate-x-[2px] bg-[var(--ms-gradient-end)]"
        }`}
      >
        {theme === "light" ? <Sun size={14} /> : <Moon size={14} />}
      </span>
    </button>
  );
}
