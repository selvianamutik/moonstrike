'use client';

import { useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastContainerProps = {
  toasts: Toast[];
  onDismiss: (id: string) => void;
};

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const styles = {
  success: 'border-[var(--ms-success)] bg-[var(--ms-success)]/10 text-[var(--ms-success)]',
  error: 'border-[var(--ms-danger)] bg-[var(--ms-danger)]/10 text-[var(--ms-danger)]',
  info: 'border-[var(--ms-primary)] bg-[var(--ms-primary)]/10 text-[var(--ms-heading)]',
};

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const firstToast = containerRef.current.querySelector<HTMLElement>('[role="alert"]');
      if (firstToast) {
        firstToast.focus();
      }
    }
  }, [toasts.length]);

  if (toasts.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            role="alert"
            aria-live="polite"
            aria-atomic="true"
            tabIndex={-1}
            className={`flex items-center gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-current ${styles[toast.type]}`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 rounded-md p-1 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-current"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

let toastIdCounter = 0;

export function createToast(type: ToastType, message: string): Toast {
  return {
    id: `toast-${++toastIdCounter}`,
    type,
    message,
  };
}

export function useToast() {
  return { createToast };
}
