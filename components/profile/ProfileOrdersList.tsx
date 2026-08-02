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
                    ? "bg-[var(--primary)] text-white"
                    : "border border-[var(--ms-border)] bg-[var(--ms-bg-card)] text-[var(--ms-body)] hover:border-[var(--primary)] hover:text-[var(--ms-heading)]"
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
              <article key={order.id} className="ms-card ms-card-hover rounded-xl p-4 sm:p-5">
                {/* Mobile: image + ref + price in top row, content below */}
                <div className="flex gap-4">
                  {/* Image — fixed size on all breakpoints */}
                  <div className="shrink-0">
                    {order.primaryImage ? (
                      <img src={order.primaryImage} alt="" className="h-16 w-16 rounded-md object-cover sm:h-20 sm:w-20 md:h-24 md:w-24" />
                    ) : (
                      <PlaceholderAsset isHidden={false} alt={`${order.serviceSummary} order preview`} className="h-16 w-16 rounded-md sm:h-20 sm:w-20 md:h-24 md:w-24" imageClassName="p-3" />
                    )}
                  </div>

                  {/* Main content */}
                  <div className="min-w-0 flex-1">
                    {/* Top row: order ref + price (on mobile price sits here) */}
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-display text-base font-black tracking-[-0.03em] sm:text-xl leading-tight">{order.orderReference}</h2>
                      <span className="mono shrink-0 text-base font-bold text-[var(--ms-price)] sm:text-xl">{formatOrderMoney(order.total, order.currency)}</span>
                    </div>

                    {/* Status badge */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(() => {
                        const isRefunded = order.status === "refunded";
                        const isRefundRequested = order.status === "refund_requested";
                        const badgeClass = isRefunded
                          ? "bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 mono text-[10px] font-bold uppercase tracking-[0.18em] text-red-500 rounded-full inline-flex items-center"
                          : isRefundRequested
                          ? "bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 mono text-[10px] font-bold uppercase tracking-[0.18em] text-red-400 rounded-full inline-flex items-center"
                          : "inline-flex items-center rounded-full bg-[var(--ms-gradient-start)]/20 px-2.5 py-0.5 mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ms-gradient-end)]";
                        return (
                          <span className={badgeClass}>
                            {order.status.replace(/_/g, " ")}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Game name badges */}
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {gameNames.map((gameName) => {
                        const isDeleted = gameName === "game no longer exist";
                        return isDeleted ? (
                          <span key={gameName} className="inline-flex items-center rounded-full bg-[var(--ms-hover-bg)] px-2.5 py-0.5 mono text-[10px] italic opacity-50 tracking-[0.12em] text-[var(--ms-body)]">
                            game no longer exist
                          </span>
                        ) : (
                          <span key={gameName} className="inline-flex items-center rounded-full bg-[var(--ms-hover-bg)] px-2.5 py-0.5 mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ms-heading)]">
                            {gameName}
                          </span>
                        );
                      })}
                    </div>

                    {/* Date + item count + detail button */}
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="mono text-[10px] uppercase tracking-[0.14em] text-[var(--ms-body)]">
                        {formatOrderDateTime(order.createdAt)} · {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                      </p>
                      <Link
                        href={`/profile/orders/${order.orderReference}`}
                        className="ms-button h-8 px-3 mono text-[10px] uppercase tracking-[0.14em] inline-flex flex-row items-center gap-1.5"
                      >
                        <Eye size={13} />
                        Detail
                      </Link>
                    </div>
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
