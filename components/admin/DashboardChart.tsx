"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const data = [
  { month: "May",   traffic: 4200, sales: 2400 },
  { month: "Jun",   traffic: 5800, sales: 3100 },
  { month: "Jul",   traffic: 5200, sales: 2900 },
  { month: "Aug",   traffic: 7100, sales: 4200 },
  { month: "Sep",   traffic: 6400, sales: 3800 },
  { month: "Oct",   traffic: 8900, sales: 5600 },
];

const CYAN   = "#22d3ee";
const PURPLE = "#8b5cf6";
const GRID   = "rgba(23,37,84,0.8)";
const MUTED  = "#94a3b8";

export function DashboardChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: MUTED, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: MUTED, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            background: "#0f172a",
            border: "1px solid #172554",
            borderRadius: "8px",
            color: "#f1f5f9",
            fontSize: 12,
          }}
          cursor={{ stroke: GRID, strokeWidth: 1 }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: MUTED }}
        />
        <Line
          type="monotone"
          dataKey="traffic"
          name="Traffic"
          stroke={CYAN}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: CYAN }}
        />
        <Line
          type="monotone"
          dataKey="sales"
          name="Sales"
          stroke={PURPLE}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: PURPLE }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
