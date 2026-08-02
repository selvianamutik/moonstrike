"use client";

import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  isLoading?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
};

const confirmStyles = {
  danger: "border-red-500/40 bg-red-500/10 text-red-500 hover:bg-red-500/20",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300 hover:bg-amber-500/20",
  primary: "border-[var(--primary)]/40 bg-[var(--primary)]/20 text-[var(--ms-heading)] hover:bg-[var(--primary)]/30",
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "warning",
  isLoading = false,
  children,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-amber-500">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--ms-heading)]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--ms-body)]">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-[var(--ms-body)] transition-colors hover:bg-[var(--ms-hover-bg)] hover:text-[var(--ms-heading)] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close confirmation dialog"
          >
            <X size={16} />
          </button>
        </div>

        {children ? <div className="mt-5">{children}</div> : null}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="admin-action-button rounded-lg border border-[var(--ms-border)] px-4 py-2.5 text-sm font-medium text-[var(--ms-body)] transition-colors hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-heading)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={16} />
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`admin-action-button rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${confirmStyles[variant]}`}
          >
            {variant === "primary" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {isLoading ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
