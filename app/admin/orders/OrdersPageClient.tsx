"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ORDER_FILTER_TABS, type AdminOrderStatus } from "@/lib/admin-constants";
import type { AdminOrderRecord } from "@/lib/admin/orders";

export function OrdersPageClient({ orders }: { orders: AdminOrderRecord[] }) {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.toLowerCase();

    return orders.filter((order) => {
      const matchTab = activeTab === "all" || order.status === activeTab;
      const matchSearch =
        !query ||
        order.id.toLowerCase().includes(query) ||
        order.orderReference.toLowerCase().includes(query) ||
        order.transactionId.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerEmail.toLowerCase().includes(query) ||
        order.serviceName.toLowerCase().includes(query);
      return matchTab && matchSearch;
    });
  }, [activeTab, orders, search]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Orders", active: true }]}
        title="Order Management"
        description="Track real checkout-created orders through the boost lifecycle."
      />

      <AdminFilterBar
        tabs={ORDER_FILTER_TABS.map((tab) => ({ id: tab.id, label: tab.label }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchPlaceholder="Search by order ID, payment, customer, or service..."
        searchValue={search}
        onSearchChange={setSearch}
        counter={`${filtered.length} orders`}
      />

      <AdminDataTable
        columns={["ORDER ID", "CUSTOMER", "DATE", "AMOUNT", "STATUS", "ACTIONS"]}
        footer={<AdminPagination showingFrom={filtered.length > 0 ? 1 : 0} showingTo={filtered.length} total={orders.length} totalPages={1} />}
      >
        {filtered.length === 0 ? (
          <tr>
            <td className="px-6 py-8 text-center text-[var(--ms-text-secondary)]" colSpan={6}>
              No orders found.
            </td>
          </tr>
        ) : (
          filtered.map((order) => (
            <tr key={order.id} className="transition-colors hover:bg-[#111827]">
              <td className="max-w-[180px] truncate px-6 py-4 font-mono font-medium text-white">{order.orderReference}</td>
              <td className="px-6 py-4">
                <div className="text-white">{order.customerName}</div>
                <div className="text-xs text-[#64748B]">{order.customerEmail}</div>
              </td>
              <td className="px-6 py-4">{order.createdAt}</td>
              <td className="px-6 py-4 font-medium text-[#22D3EE]">{order.amount}</td>
              <td className="px-6 py-4">
                <StatusBadge status={order.status as AdminOrderStatus} />
              </td>
              <td className="px-6 py-4">
                <Link href={`/admin/orders/${order.id}`} className="inline-flex p-2 text-[var(--ms-text-secondary)] hover:text-[#22D3EE]" aria-label="View">
                  <Eye size={16} />
                </Link>
              </td>
            </tr>
          ))
        )}
      </AdminDataTable>
    </div>
  );
}
