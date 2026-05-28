"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminButton } from "@/components/admin/AdminButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getNextOrderActions, type AdminOrder } from "@/lib/admin-mock";
import type { AdminOrderStatus } from "@/lib/admin-constants";

export function OrderDetailView({ order: initialOrder }: { order: AdminOrder }) {
  const [order, setOrder] = useState(initialOrder);
  const actions = getNextOrderActions(order.status);

  function applyStatus(next: AdminOrderStatus) {
    setOrder((o) => ({
      ...o,
      status: next,
      timeline: [...o.timeline, { status: next, at: new Date().toLocaleString() }],
    }));
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Orders", href: "/admin/orders" }, { label: order.id, active: true }]}
        title={`Order ${order.id}`}
        actions={
          <Link href="/admin/orders" className="flex items-center gap-2 text-sm text-[var(--ms-text-secondary)] hover:text-white">
            <ArrowLeft size={16} /> Back
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <section className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Order Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[var(--ms-text-secondary)] text-xs uppercase mb-1">Customer</p>
                <p className="text-white">{order.customerName}</p>
                <p className="text-[#64748B]">{order.customerEmail}</p>
              </div>
              <div>
                <p className="text-[var(--ms-text-secondary)] text-xs uppercase mb-1">Service</p>
                <p className="text-white">{order.serviceName}</p>
                <p className="text-[#64748B]">{order.region}</p>
              </div>
              <div>
                <p className="text-[var(--ms-text-secondary)] text-xs uppercase mb-1">Payment</p>
                <p className="text-white capitalize">{order.paymentProvider}</p>
              </div>
              <div>
                <p className="text-[var(--ms-text-secondary)] text-xs uppercase mb-1">Amount</p>
                <p className="text-[#22D3EE] font-medium">{order.amount}</p>
              </div>
            </div>

            {order.selectedOptions.length > 0 && (
              <div className="mt-6">
                <p className="text-xs text-[var(--ms-text-secondary)] uppercase mb-2">Options breakdown</p>
                <ul className="space-y-2">
                  {order.selectedOptions.map((opt, i) => (
                    <li key={i} className="flex justify-between text-sm bg-[var(--ms-primary)] rounded-lg px-4 py-2 border border-[var(--ms-accent)]">
                      <span className="text-white">
                        {opt.group}: {opt.value}
                      </span>
                      {opt.priceModifier > 0 && <span className="text-[#22D3EE]">+${opt.priceModifier}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Order Timeline</h2>
            <ol className="relative border-l border-[var(--ms-accent)] ml-3 space-y-6">
              {order.timeline.map((step, i) => (
                <li key={i} className="ml-6">
                  <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-[#8B5CF6]" />
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <StatusBadge status={step.status} />
                    <span className="text-xs text-[var(--ms-text-secondary)]">{step.at}</span>
                  </div>
                  {step.note && <p className="text-xs text-[var(--ms-text-secondary)]">{step.note}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <section className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6">
            <p className="text-xs text-[var(--ms-text-secondary)] uppercase mb-2">Current status</p>
            <StatusBadge status={order.status} className="text-sm" />
            <div className="mt-6 flex flex-col gap-2">
              {actions.map((action) => (
                <AdminButton
                  key={action.label}
                  variant={action.variant}
                  onClick={() => action.next && applyStatus(action.next)}
                  className="w-full"
                >
                  {action.label}
                </AdminButton>
              ))}
            </div>
            <AdminButton href={`/admin/messages?ticket=t1`} variant="secondary" className="w-full mt-4">
              <MessageSquare size={16} /> Open Chat
            </AdminButton>
          </section>

          {order.status === "refund_requested" && (
            <section className="bg-[var(--ms-secondary)] border border-red-500/30 rounded-xl p-6">
              <h3 className="text-white font-bold mb-3">Refund Panel</h3>
              <p className="text-sm text-[var(--ms-text-secondary)] mb-2">
                Payment: {order.paymentProvider === "stripe" ? "Card (Stripe)" : "Crypto (NowPayments)"}
              </p>
              {order.paymentProvider === "nowpayments" && (
                <div className="mb-3">
                  <label className="text-xs text-[var(--ms-text-secondary)]">Wallet address</label>
                  <input
                    className="w-full mt-1 bg-[var(--ms-primary)] border border-[var(--ms-accent)] rounded-lg px-3 py-2 text-sm text-white font-mono"
                    defaultValue={order.cryptoRefundAddress ?? ""}
                    placeholder="Customer wallet for refund"
                  />
                </div>
              )}
              <AdminButton
                variant="danger"
                className="w-full"
                onClick={() => applyStatus("refunded")}
                disabled={order.paymentProvider === "nowpayments" && !order.cryptoRefundAddress}
              >
                Issue Refund
              </AdminButton>
              {order.paymentProvider === "nowpayments" && !order.cryptoRefundAddress && (
                <p className="text-xs text-amber-400 mt-2">Awaiting wallet address</p>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
