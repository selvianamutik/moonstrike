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
    <div className="bg-[#0F172A] border border-[#172554] rounded-xl overflow-hidden flex flex-col">
      {(title || headerAction) && (
        <div className="p-6 border-b border-[#172554] flex items-center justify-between">
          {title && <h2 className="text-lg font-bold text-white">{title}</h2>}
          {headerAction}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-[#94A3B8]">
          <thead className="bg-[#111827] text-xs uppercase font-semibold text-[#64748B] border-b border-[#172554]">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-6 py-4 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#172554]">{children}</tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}
