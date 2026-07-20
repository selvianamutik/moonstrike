"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

type SearchBarProps = {
  placeholder?: string;
  defaultValue?: string;
  basePath: string;
};

export function SearchBar({ placeholder = "Search...", defaultValue = "", basePath }: SearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = inputRef.current?.value.trim() || "";
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ms-body)]"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.34-4.34" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-12 w-full rounded-lg border border-[var(--ms-border)] bg-[var(--ms-bg-card)] pl-11 pr-4 text-sm text-[var(--ms-heading)] outline-none transition-colors focus:border-[var(--ms-gradient-end)]"
      />
      {defaultValue && (
        <button
          type="button"
          onClick={() => {
            if (inputRef.current) inputRef.current.value = "";
            router.push(basePath);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--ms-body)] transition-colors hover:text-[var(--ms-heading)]"
          aria-label="Clear search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </form>
  );
}
