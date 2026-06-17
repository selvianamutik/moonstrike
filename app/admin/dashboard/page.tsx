import React from "react";
import { Calendar, Download, TrendingUp, Users, CheckCircle, AlertTriangle, ArrowRight, Shield, Award, Sparkles } from "lucide-react";
import { StatusBadge, StatusType } from "@/components/admin/StatusBadge";
import Image from "next/image";

export default function AdminDashboard() {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-[#94A3B8] font-medium mb-1 flex items-center gap-2">
            <span>Home</span>
            <span>&gt;</span>
            <span className="text-[#22D3EE]">Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-display">Operational Overview</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] border border-[#172554] rounded-lg text-sm font-medium text-[#94A3B8] hover:text-white hover:border-[#8B5CF6] transition-colors">
            <Calendar size={16} />
            Last 30 Days
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#172554] border border-[#172554] rounded-lg text-sm font-medium text-white hover:bg-[#1E293B] transition-colors shadow-sm">
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        <KPICard 
          title="TOTAL REVENUE" 
          value="$124.5k" 
          trend="+12.5%" 
          trendUp={true} 
          icon={<TrendingUp size={18} className="text-[#8B5CF6]" />} 
          progressColor="bg-[#8B5CF6]" 
          progressWidth="w-[60%]"
        />
        <KPICard 
          title="ACTIVE USERS" 
          value="12,840" 
          trend="+8.2%" 
          trendUp={true} 
          icon={<Users size={18} className="text-[#22D3EE]" />} 
          progressColor="bg-[#22D3EE]" 
          progressWidth="w-[45%]"
        />
        <KPICard 
          title="COMPLETED BOOSTS" 
          value="5,420" 
          trend="+24.1%" 
          trendUp={true} 
          icon={<CheckCircle size={18} className="text-[#A855F7]" />} 
          progressColor="bg-[#A855F7]" 
          progressWidth="w-[75%]"
        />
        <KPICard 
          title="PENDING DISPUTES" 
          value="12" 
          trend="-3%" 
          trendUp={false} 
          icon={<AlertTriangle size={18} className="text-[#EF4444]" />} 
          progressColor="bg-[#EF4444]" 
          progressWidth="w-[15%]"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Chart Area */}
        <div className="col-span-2 bg-[#0F172A] border border-[#172554] rounded-xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8 border-b border-[#172554] pb-4">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Traffic vs Performance</h2>
              <p className="text-sm text-[var(--admin-muted)]">Correlation between ad spend and user conversion.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#22D3EE]"></span>
                <span className="text-xs text-[#94A3B8]">Traffic</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]"></span>
                <span className="text-xs text-[#94A3B8]">Sales</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 relative flex flex-col justify-between">
            {/* Horizontal lines for chart grid */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border-b border-[#172554] w-full flex-1"></div>
            ))}
            {/* Chart placeholder text if needed, currently empty representing the grid in design */}
          </div>
        </div>

        {/* Top Selling Services */}
        <div className="col-span-1 bg-[#0F172A] border border-[#172554] rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-6">Top Selling Services</h2>
          <div className="flex flex-col gap-6">
            <TopServiceItem 
              icon={<Award size={18} className="text-[#22D3EE]" />} 
              name="Diamond Rank Boost" 
              category="Competitive FPS" 
              revenue="$42k" 
            />
            <TopServiceItem 
              icon={<Sparkles size={18} className="text-[#8B5CF6]" />} 
              name="Legendary Skins Pack" 
              category="Open World RPG" 
              revenue="$38k" 
            />
            <TopServiceItem 
              icon={<Users size={18} className="text-[#22D3EE]" />} 
              name="Coaching Sessions" 
              category="Multiplayer Arena" 
              revenue="$21k" 
            />
            <TopServiceItem 
              icon={<Shield size={18} className="text-[#8B5CF6]" />} 
              name="Account Protection" 
              category="Security Add-on" 
              revenue="$14k" 
            />
          </div>
          <button className="w-full mt-6 py-2.5 bg-transparent border border-[#172554] rounded-lg text-sm font-medium text-[#94A3B8] hover:text-white hover:bg-[#172554]/50 transition-colors">
            View All Services
          </button>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-[var(--admin-border)] flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Recent Activity</h2>
          <a href="/admin/transactions" className="text-sm font-medium text-[var(--admin-cyan)] hover:text-[var(--admin-accent)] transition-colors flex items-center gap-1">
            View Transaction Log <ArrowRight size={14} />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--admin-muted)]">
            <thead className="bg-[var(--admin-surface-header)] text-xs uppercase font-semibold text-[var(--admin-muted-dark)] border-b border-[var(--admin-border)]">
              <tr>
                <th className="px-6 py-4">TRANSACTION ID</th>
                <th className="px-6 py-4">CUSTOMER</th>
                <th className="px-6 py-4">SERVICE</th>
                <th className="px-6 py-4">DATE</th>
                <th className="px-6 py-4">AMOUNT</th>
                <th className="px-6 py-4">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-border)]">
              <TableRow 
                id="#TRX-94821" 
                customer="vortex_striker" 
                service="Diamond III Rank Up" 
                date="Oct 24, 2024" 
                amount="$249.00" 
                status="Paid" 
              />
              <TableRow 
                id="#TRX-94820" 
                customer="nebula_queen" 
                service="Prestige Account Kit" 
                date="Oct 24, 2024" 
                amount="$599.00" 
                status="Pending" 
              />
              <TableRow 
                id="#TRX-94819" 
                customer="ghost_runner" 
                service="Placement Matches (x5)" 
                date="Oct 23, 2024" 
                amount="$85.00" 
                status="Paid" 
              />
              <TableRow 
                id="#TRX-94818" 
                customer="shadow_fist" 
                service="Currency Pack 100k" 
                date="Oct 23, 2024" 
                amount="$12.00" 
                status="Refunded" 
              />
              <TableRow 
                id="#TRX-94817" 
                customer="pixel_paladin" 
                service="Custom Skin Design" 
                date="Oct 22, 2024" 
                amount="$150.00" 
                status="Paid" 
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, trend, trendUp, icon, progressColor, progressWidth }: any) {
  return (
    <div className="bg-[#0F172A] border border-[#172554] rounded-xl p-5 relative overflow-hidden group hover:border-[#8B5CF6] transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-[#172554]/50 flex items-center justify-center border border-[#172554]">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
          {trendUp ? <TrendingUp size={12} /> : <TrendingUp size={12} className="transform rotate-180" />}
          {trend}
        </div>
      </div>
      <div className="mb-1 text-xs font-medium text-[#94A3B8] tracking-wider">{title}</div>
      <div className="text-3xl font-bold text-white mb-4">{value}</div>
      <div className="h-1 w-full bg-[#172554] rounded-full overflow-hidden">
        <div className={`h-full ${progressColor} ${progressWidth}`}></div>
      </div>
    </div>
  );
}

function TopServiceItem({ icon, name, category, revenue }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-[#172554]/50 flex items-center justify-center border border-[#172554]">
          {icon}
        </div>
        <div>
          <div className="text-sm font-bold text-white">{name}</div>
          <div className="text-xs text-[#94A3B8]">{category}</div>
        </div>
      </div>
      <div className="text-sm font-medium text-[#8B5CF6]">{revenue}</div>
    </div>
  );
}

function TableRow({ id, customer, service, date, amount, status }: any) {
  return (
    <tr className="hover:bg-[#111827] transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-white font-medium">{id}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#172554] border border-[#22D3EE]/30 flex items-center justify-center overflow-hidden">
            <span className="text-[10px] text-white">{(customer as string).substring(0, 2).toUpperCase()}</span>
          </div>
          <span className="text-white">{customer}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-white">{service}</td>
      <td className="px-6 py-4 whitespace-nowrap">{date}</td>
      <td className="px-6 py-4 whitespace-nowrap text-[#22D3EE] font-medium">{amount}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={status as StatusType} />
      </td>
    </tr>
  );
}

