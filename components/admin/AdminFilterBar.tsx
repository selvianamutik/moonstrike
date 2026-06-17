"use client";

import React from "react";
import { Search } from "lucide-react";

export type FilterTab = { id: string; label: string };

type AdminFilterBarProps = {
  tabs?: FilterTab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  statusOptions?: string[];
  statusValue?: string;
  onStatusChange?: (value: string) => void;
  extra?: React.ReactNode;
  counter?: string;
};

export function AdminFilterBar({
  tabs,
  activeTab,
  onTabChange,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  statusOptions,
  statusValue,
  onStatusChange,
  extra,
  counter,
}: AdminFilterBarProps) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {tabs && (
          <div className="flex items-center gap-2" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`px-4 min-h-[44px] rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[var(--admin-accent)] text-white"
                    : "bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-muted)] hover:text-white hover:border-[var(--admin-accent)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
        {counter && <span className="text-sm text-[var(--admin-muted)]">{counter}</span>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {onSearchChange !== undefined && (
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]" aria-hidden="true" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[var(--admin-surface)] border border-[var(--admin-border)] text-white text-sm rounded-lg pl-10 pr-4 py-2.5 min-h-[44px] outline-none focus:ring-1 focus:ring-[var(--admin-accent)] focus:border-[var(--admin-accent)] placeholder:text-[var(--admin-muted-dark)]"
            />
          </div>
        )}
        {statusOptions && onStatusChange && (
          <select
            value={statusValue}
            onChange={(e) => onStatusChange(e.target.value)}
            className="bg-[var(--admin-surface)] border border-[var(--admin-border)] text-white text-sm rounded-lg px-4 py-2.5 min-h-[44px] outline-none focus:ring-1 focus:ring-[var(--admin-accent)] cursor-pointer"
          >
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )}
        {extra}
      </div>
    </div>
  );
}
