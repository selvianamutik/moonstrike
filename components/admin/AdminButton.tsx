import Link from "next/link";
import React from "react";

type AdminButtonProps = {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  type?: "button" | "submit";
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
};

const variants = {
  primary:
    "bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] border-transparent",
  secondary:
    "bg-transparent border border-[#172554] text-[#94A3B8] hover:text-white hover:border-[#8B5CF6]",
  danger: "bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10",
  ghost: "bg-[#0F172A] border border-[#172554] text-[#94A3B8] hover:text-white hover:border-[#8B5CF6]",
};

export function AdminButton({
  children,
  href,
  variant = "primary",
  type = "button",
  onClick,
  className = "",
  disabled = false,
}: AdminButtonProps) {
  const base =
    "admin-action-button inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all " +
    variants[variant] +
    " " +
    className;

  if (href) {
    return (
      <Link href={href} className={base}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={base + (disabled ? " opacity-50 cursor-not-allowed" : "")}>
      {children}
    </button>
  );
}
