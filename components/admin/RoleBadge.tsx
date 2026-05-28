import React from "react";
import type { AdminUserRole } from "@/lib/admin-mock";

export function RoleBadge({ role }: { role: AdminUserRole }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold border bg-[#8B5CF6]/20 text-[#A78BFA] border-[#8B5CF6]/30">
      {role}
    </span>
  );
}
