"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Eye, Package, RotateCcw } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { SheetsSyncButton } from "@/components/admin/SheetsSyncButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ActionTooltip } from "@/components/common/ActionTooltip";
import { ORDER_FILTER_TABS, type AdminOrderStatus } from "@/lib/admin-constants";
import type { AdminOrderRecord } from "@/lib/admin/orders";

type DateFilter = "all" | "7d" | "30d" | "custom";

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function matchesDateFilter(createdAtIso: string, dateFilter: DateFilter, dateFrom: string, dateTo: string) {
  if (dateFilter === "all") return true;

  const createdAt = new Date(createdAtIso).getTime();

  if (dateFilter === "7d" || dateFilter === "30d") {
    const days = dateFilter === "7d" ? 7 : 30;
    return Date.now() - createdAt <= days * 24 * 60 * 60 * 1000;
  }

  const from = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
  const to = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;

  return createdAt >= from && createdAt <= to;
}

export function OrdersPageClient({ orders }: { orders: AdminOrderRecord[] }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();

    return orders.filter((order) => {
      const matchStatus = statusFilter === "all" || order.status === statusFilter;
      const matchDate = matchesDateFilter(order.createdAtIso, dateFilter, dateFrom, dateTo);
      const matchSearch =
        !query ||
        order.id.toLowerCase().includes(query) ||
        order.orderReference.toLowerCase().includes(query) ||
        order.transactionId.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerEmail.toLowerCase().includes(query) ||
        order.serviceName.toLowerCase().includes(query);
      return matchStatus && matchDate && matchSearch;
    });
  }, [dateFilter, dateFrom, dateTo, orders, search, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedOrders = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const showingFrom = filtered.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const showingTo = filtered.length > 0 ? showingFrom + pagedOrders.length - 1 : 0;
  const stats = useMemo(() => {
    const activeOrders = filtered.filter((order) => ["pending", "confirmed", "in_progress", "delivered"].includes(order.status)).length;
    const completedOrders = filtered.filter((order) => order.status === "completed").length;
    const refundRequests = filtered.filter((order) => order.status === "refund_requested").length;
    const activeProgress = filtered.length > 0 ? Math.round((activeOrders / filtered.length) * 100) : 0;

    return {
      activeOrders,
      completedOrders,
      refundRequests,
      totalOrders: filtered.length,
      activeProgress,
    };
  }, [filtered]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Orders", active: true }]}
        title="Order Management"
        description="Track real checkout-created orders through the boost lifecycle."
        actions={<SheetsSyncButton target="orders" label="Sync Orders" />}
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard title="TOTAL ORDERS" value={String(stats.totalOrders)} icon={<Package size={18} className="text-[#8B5CF6]" />} progressColor="bg-[#8B5CF6]" progressWidth="w-[65%]" />
        <AdminStatCard title="ACTIVE ORDERS" value={String(stats.activeOrders)} subtitle="Pending to delivered" icon={<Clock size={18} className="text-[#22D3EE]" />} progressColor="bg-[#22D3EE]" progressPercent={stats.activeProgress} />
        <AdminStatCard title="COMPLETED" value={String(stats.completedOrders)} subtitle="Finished orders" icon={<CheckCircle2 size={18} className="text-green-500" />} progressColor="bg-green-500" progressWidth="w-[55%]" />
        <AdminStatCard title="REFUND REQUESTS" value={String(stats.refundRequests)} subtitle="Needs admin review" icon={<RotateCcw size={18} className="text-amber-500" />} progressColor="bg-amber-500" progressWidth="w-[20%]" />
      </div>

      <AdminFilterBar
        searchPlaceholder="Search by order ID, payment, customer, or service..."
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        extra={
          <>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-[#172554] bg-[#0F172A] px-4 py-2.5 text-sm text-white outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
            >
              {ORDER_FILTER_TABS.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.id === "all" ? "All Status" : tab.label}
                </option>
              ))}
            </select>
            <select
              value={dateFilter}
              onChange={(event) => {
                const nextFilter = event.target.value as DateFilter;
                setDateFilter(nextFilter);
                if (nextFilter === "custom" && !dateTo) {
                  setDateTo(getTodayInputValue());
                }
                setPage(1);
              }}
              className="rounded-lg border border-[#172554] bg-[#0F172A] px-4 py-2.5 text-sm text-white outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
            >
              <option value="all">All Dates</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
            {dateFilter === "custom" ? (
              <div className="flex items-center gap-2 rounded-lg border border-[#172554] bg-[#0F172A] px-3 py-2 text-sm text-white focus-within:border-[#8B5CF6] focus-within:ring-1 focus-within:ring-[#8B5CF6]">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => {
                    setDateFrom(event.target.value);
                    setPage(1);
                  }}
                  className="w-[135px] bg-transparent text-sm text-white outline-none"
                  aria-label="Order date from"
                />
                <span className="text-[var(--ms-text-secondary)]">-</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => {
                    setDateTo(event.target.value);
                    setPage(1);
                  }}
                  className="w-[135px] bg-transparent text-sm text-white outline-none"
                  aria-label="Order date to"
                />
              </div>
            ) : null}
          </>
        }
        counter={`${filtered.length} orders`}
      />

      <AdminDataTable
        columns={["ORDER ID", "CUSTOMER", "DATE", "AMOUNT", "STATUS", "ACTIONS"]}
        footer={
          <AdminPagination
            showingFrom={showingFrom}
            showingTo={showingTo}
            total={filtered.length}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize);
              setPage(1);
            }}
          />
        }
      >
        {filtered.length === 0 ? (
          <tr>
            <td className="px-6 py-8 text-center text-[var(--ms-text-secondary)]" colSpan={6}>
              No orders found.
            </td>
          </tr>
        ) : (
          pagedOrders.map((order) => (
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
                <ActionTooltip label="View detail">
                  <Link href={`/admin/orders/${order.orderReference}`} className="admin-action-icon hover:border-[#22D3EE] hover:text-[#22D3EE]" aria-label="View">
                    <Eye size={16} />
                  </Link>
                </ActionTooltip>
              </td>
            </tr>
          ))
        )}
      </AdminDataTable>
    </div>
  );
}
