"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Gamepad2 } from "lucide-react";
import { PlaceholderAsset } from "@/components/asset-image";
import type { CustomerOrder, OrderCurrency } from "@/lib/orders";

const filters = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "In Progress", value: "in_progress" },
  { label: "Delivered", value: "delivered" },
  { label: "Completed", value: "completed" },
  { label: "Refund Requested", value: "refund_requested" },
  { label: "Refunded", value: "refunded" },
];

function formatOrderMoney(value: number, currency: OrderCurrency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

function formatOrderDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ProfileOrdersList({ orders }: { orders: CustomerOrder[] }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const filteredOrders = useMemo(
    () => orders.filter((order) => activeFilter === "all" || order.status === activeFilter),
    [activeFilter, orders],
  );
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const showingFrom = filteredOrders.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const showingTo = filteredOrders.length > 0 ? showingFrom + pagedOrders.length - 1 : 0;

  return (
    <>
      <div className="-mx-1 mt-5 overflow-x-auto px-1 pb-2">
        <div className="flex w-max gap-2">
          {filters.map((filter) => {
            const isActive = activeFilter === filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => {
                  setActiveFilter(filter.value);
                  setPage(1);
                }}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#8B5CF6] text-white"
                    : "border border-[#172554] bg-[#0F172A] text-[#94A3B8] hover:border-[#8B5CF6] hover:text-white"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {orders.length === 0 ? (
          <div className="ms-card rounded-xl p-8 text-center">
            <h2 className="text-xl font-black">No orders yet</h2>
            <p className="mt-3 text-[var(--ms-body)]">Placed orders will appear here after checkout.</p>
            <Link href="/games" className="ms-button mt-6 inline-flex h-11 items-center px-5 mono text-xs uppercase tracking-[0.14em]">
              <Gamepad2 size={16} />
              Browse Games
            </Link>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="ms-card rounded-xl p-8 text-center">
            <h2 className="text-xl font-black">No matching orders</h2>
            <p className="mt-3 text-[var(--ms-body)]">Try a different order status filter.</p>
          </div>
        ) : (
          pagedOrders.map((order) => {
            const gameNames = Array.from(new Set(order.items.map((item) => item.service.gameName))).filter(Boolean);

            return (
              <article key={order.id} className="ms-card ms-card-hover rounded-xl p-5">
                <div className="grid gap-5 md:grid-cols-[96px_1fr_auto] md:items-center">
                  {order.primaryImage ? (
                    <img src={order.primaryImage} alt="" className="h-24 w-24 rounded-md object-cover" />
                  ) : (
                    <PlaceholderAsset alt={`${order.serviceSummary} order preview`} className="h-24 rounded-md" imageClassName="p-4" />
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-xl font-black tracking-[-0.03em]">{order.orderReference}</h2>
                    </div>
                    <div className="mt-3 flex min-h-8 flex-wrap content-start gap-2">
                      <span className="inline-flex items-center rounded-full bg-[var(--ms-gradient-start)]/20 px-3 py-1 mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ms-gradient-end)]">
                        {order.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="mt-2 flex min-h-8 flex-wrap content-start gap-2">
                      {gameNames.map((gameName) => (
                        <span key={gameName} className="inline-flex items-center rounded-full bg-[var(--ms-hover-bg)] px-3 py-1 mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ms-body)]">
                          {gameName}
                        </span>
                      ))}
                    </div>
                    <p className="mono mt-3 text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]">
                      {formatOrderDateTime(order.createdAt)} / {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-5 md:flex-col md:items-end">
                    <span className="mono text-xl text-[var(--ms-price)]">{formatOrderMoney(order.total, order.currency)}</span>
                    <Link href={`/profile/orders/${order.orderReference}`} className="ms-button h-10 px-5 mono text-xs uppercase tracking-[0.14em]">
                      <Eye size={16} />
                      View Details
                    </Link>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
      {filteredOrders.length > 0 ? (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] px-5 py-4 text-sm text-[var(--ms-body)] md:flex-row md:items-center md:justify-between">
          <span>
            Showing {showingFrom} to {showingTo} of {filteredOrders.length.toLocaleString()}
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs">
              <span>Rows</span>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-[var(--ms-border)] bg-[var(--ms-bg-card)] px-2.5 py-2 text-xs text-[var(--ms-heading)] outline-none"
              >
                {[10, 20, 50, 100].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="ms-action-icon disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 text-xs">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                className="ms-action-icon disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
