import React from "react";

type AdminDataTableProps = {
  title?: string;
  headerAction?: React.ReactNode;
  columns: string[];
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AdminDataTable({ title, headerAction, columns, children, footer }: AdminDataTableProps) {
  return (
    <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-xl overflow-hidden flex flex-col">
      {(title || headerAction) && (
        <div className="p-6 border-b border-[var(--admin-border)] flex items-center justify-between">
          {title && <h2 className="text-lg font-bold text-white">{title}</h2>}
          {headerAction}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-[var(--admin-muted)]">
          <thead className="bg-[var(--admin-surface-header)] text-xs uppercase font-semibold text-[var(--admin-muted-dark)] border-b border-[var(--admin-border)]">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-6 py-4 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--admin-border)]">{children}</tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}
