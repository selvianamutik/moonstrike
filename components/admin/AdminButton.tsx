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
    "bg-gradient-to-r from-[var(--admin-accent)] to-[#6366F1] text-white hover:shadow-[0_0_20px_var(--admin-accent-hover)] border-transparent",
  secondary:
    "bg-transparent border border-[var(--admin-border)] text-[var(--admin-muted)] hover:text-white hover:border-[var(--admin-accent)]",
  danger:
    "bg-transparent border border-[var(--admin-danger-dim)] text-red-400 hover:bg-[var(--admin-danger-dim)]",
  ghost:
    "bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-muted)] hover:text-white hover:border-[var(--admin-accent)]",
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
