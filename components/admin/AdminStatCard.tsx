import React from "react";
import { TrendingUp } from "lucide-react";

type AdminStatCardProps = {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon?: React.ReactNode;
  subtitle?: string;
  progressColor?: string;
  progressWidth?: string;
};

export function AdminStatCard({
  title,
  value,
  trend,
  trendUp = true,
  icon,
  subtitle,
  progressColor = "bg-[#8B5CF6]",
  progressWidth = "w-[50%]",
}: AdminStatCardProps) {
  return (
    <div className="bg-[#0F172A] border border-[#172554] rounded-xl p-5 hover:border-[#8B5CF6] transition-colors">
      <div className="flex items-center justify-between mb-4">
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-[#172554]/50 flex items-center justify-center border border-[#172554]">
            {icon}
          </div>
        )}
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trendUp ? "text-green-500" : "text-red-500"}`}>
            <TrendingUp size={12} className={!trendUp ? "rotate-180" : ""} />
            {trend}
          </div>
        )}
      </div>
      <div className="text-xs font-medium text-[#94A3B8] tracking-wider mb-1">{title}</div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      {subtitle && <div className="text-xs text-[#64748B] mb-3">{subtitle}</div>}
      {!subtitle && progressWidth && (
        <div className="h-1 w-full bg-[#172554] rounded-full overflow-hidden mt-3">
          <div className={`h-full ${progressColor} ${progressWidth}`} />
        </div>
      )}
    </div>
  );
}
