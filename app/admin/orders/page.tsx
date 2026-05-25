"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { adminOrders } from "@/lib/admin-mock";
import { ORDER_FILTER_TABS } from "@/lib/admin-constants";
import type { AdminOrderStatus } from "@/lib/admin-constants";

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const sorted = useMemo(
    () => [...adminOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    []
  );

  const filtered = useMemo(() => {
    return sorted.filter((o) => {
      const matchTab = activeTab === "all" || o.status === activeTab;
      const matchSearch =
        !search ||
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [activeTab, search, sorted]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <AdminPageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Orders", active: true }]}
        title="Order Management"
        description="Track orders through the boost lifecycle (§11 state machine)."
      />

      <AdminFilterBar
        tabs={ORDER_FILTER_TABS.map((t) => ({ id: t.id, label: t.label }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchPlaceholder="Search by order ID or customer..."
        searchValue={search}
        onSearchChange={setSearch}
        counter={`${filtered.length} orders`}
      />

      <AdminDataTable
        columns={["ORDER ID", "CUSTOMER", "SERVICE", "OPTIONS SUMMARY", "DATE", "AMOUNT", "STATUS", "ACTIONS"]}
        footer={<AdminPagination showingFrom={1} showingTo={filtered.length} total={adminOrders.length} totalPages={1} />}
      >
        {filtered.map((order) => (
          <tr key={order.id} className="hover:bg-[#111827] transition-colors">
            <td className="px-6 py-4 text-white font-medium font-mono">{order.id}</td>
            <td className="px-6 py-4">
              <div className="text-white">{order.customerName}</div>
              <div className="text-xs text-[#64748B]">{order.customerEmail}</div>
            </td>
            <td className="px-6 py-4 text-white">{order.serviceName}</td>
            <td className="px-6 py-4 text-sm text-[var(--ms-text-secondary)] max-w-[200px] truncate">{order.optionsSummary}</td>
            <td className="px-6 py-4">{order.createdAt}</td>
            <td className="px-6 py-4 text-[#22D3EE] font-medium">{order.amount}</td>
            <td className="px-6 py-4">
              <StatusBadge status={order.status as AdminOrderStatus} />
            </td>
            <td className="px-6 py-4">
              <Link href={`/admin/orders/${order.id}`} className="p-2 inline-flex text-[var(--ms-text-secondary)] hover:text-[#22D3EE]" aria-label="View">
                <Eye size={16} />
              </Link>
            </td>
          </tr>
        ))}
      </AdminDataTable>
    </div>
  );
}
