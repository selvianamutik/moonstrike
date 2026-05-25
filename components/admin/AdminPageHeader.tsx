import React from "react";

type Breadcrumb = { label: string; href?: string; active?: boolean };

type AdminPageHeaderProps = {
  breadcrumbs: Breadcrumb[];
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export function AdminPageHeader({ breadcrumbs, title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div>
        <div className="text-xs text-[#94A3B8] font-medium mb-1 flex items-center gap-2 flex-wrap">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span>&gt;</span>}
              <span className={crumb.active ? "text-[#22D3EE]" : ""}>{crumb.label}</span>
            </React.Fragment>
          ))}
        </div>
        <h1 className="text-3xl font-bold text-white font-display">{title}</h1>
        {description && <p className="text-sm text-[#94A3B8] mt-2 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}
