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
          <div className="flex items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange?.(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#8B5CF6] text-white"
                    : "bg-[#0F172A] border border-[#172554] text-[#94A3B8] hover:text-white hover:border-[#8B5CF6]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
        {counter && <span className="text-sm text-[#94A3B8]">{counter}</span>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {onSearchChange !== undefined && (
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#0F172A] border border-[#172554] text-white text-sm rounded-lg pl-10 pr-4 py-2.5 outline-none focus:ring-1 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] placeholder-[#64748B]"
            />
          </div>
        )}
        {statusOptions && onStatusChange && (
          <select
            value={statusValue}
            onChange={(e) => onStatusChange(e.target.value)}
            className="bg-[#0F172A] border border-[#172554] text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-[#8B5CF6]"
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
