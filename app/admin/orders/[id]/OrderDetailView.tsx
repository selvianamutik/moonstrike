"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminButton } from "@/components/admin/AdminButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getNextOrderActions, type AdminOrderActionStatus, type AdminOrderRecord } from "@/lib/admin/orders";
import type { AdminOrderStatus } from "@/lib/admin-constants";

export function OrderDetailView({ order: initialOrder }: { order: AdminOrderRecord }) {
  const [order, setOrder] = useState(initialOrder);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [refundAmount, setRefundAmount] = useState(initialOrder.total.toFixed(2));
  const [refundMessage, setRefundMessage] = useState("");
  const actions = getNextOrderActions(order.status);

  async function applyStatus(next: AdminOrderActionStatus) {
    if (next === "refund_requested") {
      const confirmed = window.confirm("Mark this order as refund requested? Delivery work may need to pause while the request is reviewed.");

      if (!confirmed) return;
    }

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to update order.");
        return;
      }

      const returnedStatus = typeof payload.status === "string" ? (payload.status as AdminOrderStatus) : next;

      setOrder((current) => ({
        ...current,
        status: returnedStatus as AdminOrderStatus,
        updatedAt: new Date().toLocaleString(),
        timeline: [...current.timeline, { status: returnedStatus as AdminOrderStatus, at: new Date().toLocaleString() }],
      }));
    } catch {
      setError("Unable to reach admin order service.");
    } finally {
      setIsSaving(false);
    }
  }

  async function issueRefund() {
    const amount = Number(refundAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Refund amount must be greater than 0.");
      return;
    }

    if (amount > order.total) {
      setError("Refund amount cannot be higher than the order total.");
      return;
    }

    const confirmed =
      order.paymentProvider === "stripe"
        ? window.confirm(
            `Issue a ${order.currency} ${amount.toFixed(2)} Stripe refund? This sends money back through Stripe and marks the Moon Strike order as refunded.`,
          )
        : window.confirm(
            `Mark this ${order.currency} ${amount.toFixed(2)} ${order.paymentProvider} order as manually refunded? Only continue after you have sent the refund through the external provider or wallet transfer.`,
          );

    if (!confirmed) return;

    setIsSaving(true);
    setError("");
    setRefundMessage("");

    try {
      const response = await fetch(`/api/admin/orders/${order.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to issue refund.");
        return;
      }

      setRefundMessage(
        order.paymentProvider === "stripe"
          ? `Stripe refund issued${payload.refundId ? `: ${payload.refundId}` : "."}`
          : "Manual refund recorded.",
      );
      setOrder((current) => ({
        ...current,
        status: "refunded",
        updatedAt: new Date().toLocaleString(),
        timeline: [...current.timeline, { status: "refunded", at: new Date().toLocaleString() }],
      }));
    } catch {
      setError("Unable to reach refund service.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Orders", href: "/admin/orders" }, { label: order.orderReference, active: true }]}
        title="Order Detail"
        actions={
          <Link href="/admin/orders" className="flex items-center gap-2 text-sm text-[var(--ms-text-secondary)] hover:text-white">
            <ArrowLeft size={16} /> Back
          </Link>
        }
      />

      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

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
                <p className="text-[var(--ms-text-secondary)] text-xs uppercase mb-1">Services</p>
                <p className="text-white">{order.serviceName}</p>
                <p className="text-[#64748B]">{order.gameName} / {order.itemCount} item{order.itemCount === 1 ? "" : "s"}</p>
              </div>
              <div>
                <p className="text-[var(--ms-text-secondary)] text-xs uppercase mb-1">Amount</p>
                <p className="text-[#22D3EE] font-medium">{order.amount}</p>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-[var(--ms-accent)] bg-[var(--ms-primary)] p-4 text-sm">
              <p className="text-[var(--ms-text-secondary)] text-xs uppercase mb-3">Payment information</p>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-[#64748B] text-xs uppercase mb-1">Provider</p>
                  <p className="text-white capitalize">{order.paymentProvider}</p>
                </div>
                <div>
                  <p className="text-[#64748B] text-xs uppercase mb-1">Order reference</p>
                  <p className="font-mono break-all text-white">{order.orderReference}</p>
                </div>
                <div>
                  <p className="text-[#64748B] text-xs uppercase mb-1">Payment reference</p>
                  <p className="font-mono break-all text-white">{order.transactionId}</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs text-[var(--ms-text-secondary)] uppercase mb-2">Service breakdown</p>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <details key={item.id} className="rounded-lg border border-[var(--ms-accent)] bg-[var(--ms-primary)] p-4" open={index === 0}>
                    <summary className="flex cursor-pointer list-none flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        {item.serviceImage ? (
                          <img src={item.serviceImage} alt="" className="h-12 w-12 rounded-md object-cover" />
                        ) : (
                          <div className="h-12 w-12 rounded-md border border-[var(--ms-accent)] bg-[#111827]" />
                        )}
                        <div>
                          <p className="font-medium text-white">{item.serviceName}</p>
                          <p className="text-xs text-[#64748B]">{item.gameName} / {item.categoryName}</p>
                        </div>
                      </div>
                      <span className="font-mono font-medium text-[#22D3EE]">{item.amount}</span>
                    </summary>
                    <ul className="mt-4 space-y-2 border-t border-[var(--ms-accent)] pt-4">
                      {item.selectedOptions.length === 0 ? (
                        <li className="text-sm text-[var(--ms-text-secondary)]">No selected options.</li>
                      ) : (
                        item.selectedOptions.map((opt, i) => (
                          <li key={`${item.id}-${i}`} className="flex justify-between rounded-lg border border-[var(--ms-accent)] bg-[#111827] px-4 py-2 text-sm">
                            <span className="text-white">
                              {opt.group}: {opt.value}
                            </span>
                            {opt.priceModifier > 0 && <span className="text-[#22D3EE]">+{opt.priceModifier.toFixed(2)} {item.currency}</span>}
                          </li>
                        ))
                      )}
                    </ul>
                  </details>
                ))}
              </div>
            </div>
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
              {actions.filter((action) => action.next !== "refunded").map((action) => (
                <AdminButton
                  key={action.label}
                  variant={action.variant}
                  onClick={() => action.next && applyStatus(action.next)}
                  className="w-full"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : action.label}
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
              <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-300">
                {order.paymentProvider === "stripe"
                  ? "This issues a real Stripe refund. The amount cannot be higher than the order total."
                  : "Crypto refunds are manual. Send the refund through NOWPayments, a wallet transfer, or another provider first, then record it here."}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[var(--ms-text-secondary)]">Refund amount</label>
                  <div className="mt-1 flex items-center rounded-lg border border-[var(--ms-accent)] bg-[var(--ms-primary)] px-3">
                    <span className="font-mono text-xs text-[#64748B]">{order.currency}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={refundAmount}
                      onChange={(event) => setRefundAmount(event.target.value)}
                      className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none"
                    />
                  </div>
                  <p className="mt-1 text-xs text-[#64748B]">Maximum: {order.amount}</p>
                </div>
              </div>
              <AdminButton
                variant="danger"
                className="w-full"
                onClick={issueRefund}
                disabled={isSaving}
              >
                {isSaving ? "Issuing..." : order.paymentProvider === "stripe" ? "Issue Stripe Refund" : "Record Manual Refund"}
              </AdminButton>
              {refundMessage ? <p className="mt-2 text-xs text-emerald-400">{refundMessage}</p> : null}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
