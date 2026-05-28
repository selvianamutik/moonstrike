"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import "@/app/admin/admin-theme.css";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/admin/login";

  if (isAuthPage) {
    return <div className="admin-theme">{children}</div>;
  }

  return (
    <div className="admin-theme min-h-screen bg-[var(--ms-primary)] text-[var(--ms-text-primary)]">
      <AdminSidebar />
      <AdminTopBar />
      <div className="pl-[240px] pt-16 flex flex-col min-h-screen">
        <main className="flex-1 p-8">{children}</main>
        <footer className="h-12 border-t border-[var(--ms-accent)] bg-[var(--ms-primary)] px-8 flex items-center justify-between text-xs text-[var(--ms-text-secondary)]">
          <span>Moon Strike &copy; 2024 Moon Strike. All systems operational.</span>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">
              Support
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              API Docs
            </a>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-medium text-green-500 uppercase">System Pulse: Stable</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
