import React from "react";

export function AdminFormField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-[var(--admin-muted)] mb-2">{label}</label>
      {children}
    </div>
  );
}

export const adminInputClass =
  "w-full bg-[var(--admin-field)] border border-[var(--admin-border)] text-white rounded-lg px-4 min-h-[44px] text-sm outline-none focus:ring-1 focus:ring-[var(--admin-accent)] focus:border-[var(--admin-accent)]";

export const adminSelectClass = adminInputClass + " cursor-pointer";

export const adminTextareaClass =
  "w-full bg-[var(--admin-field)] border border-[var(--admin-border)] text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[var(--admin-accent)] focus:border-[var(--admin-accent)] min-h-[120px] resize-y";
