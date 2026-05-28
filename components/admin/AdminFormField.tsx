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
      <label className="block text-sm font-medium text-[#94A3B8] mb-2">{label}</label>
      {children}
    </div>
  );
}

export const adminInputClass =
  "w-full bg-[#050816] border border-[#172554] text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#8B5CF6] focus:border-[#8B5CF6]";

export const adminSelectClass = adminInputClass;

export const adminTextareaClass = adminInputClass + " min-h-[120px] resize-y";
