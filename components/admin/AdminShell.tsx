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
    <div className="admin-theme min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text)]">
      <AdminSidebar />
      <AdminTopBar />
      <div className="pl-[var(--admin-sidebar-w,320px)] pt-16 flex flex-col min-h-screen">
        <main className="flex-1 p-8">{children}</main>
        <footer className="h-12 border-t border-[var(--admin-border)] bg-[var(--admin-bg)] px-8 flex items-center justify-between text-xs text-[var(--admin-muted)]">
          <span>Moon Strike &copy; 2024 Moon Strike. All systems operational.</span>
          <div className="flex items-center gap-6">
            <a href="/admin/support" className="hover:text-white transition-colors cursor-pointer">
              Support
            </a>
            <a href="/admin/privacy" className="hover:text-white transition-colors cursor-pointer">
              Privacy Policy
            </a>
            <a href="/admin/docs" className="hover:text-white transition-colors cursor-pointer">
              API Docs
            </a>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--ms-success)] animate-pulse" aria-hidden="true" />
              <span className="font-medium text-[var(--ms-success)] uppercase">System Pulse: Stable</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
