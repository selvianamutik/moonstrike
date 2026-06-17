"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, MessageSquare, PackageCheck, Play, RotateCcw, Truck, XCircle } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminButton } from "@/components/admin/AdminButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { getNextOrderActions, type AdminOrderActionStatus, type AdminOrderRecord } from "@/lib/admin/orders";
import type { AdminOrderStatus } from "@/lib/admin-constants";
import type { RefundMode } from "@/lib/payments/types";

export function OrderDetailView({ order: initialOrder }: { order: AdminOrderRecord }) {
  const [order, setOrder] = useState(initialOrder);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [refundAmount, setRefundAmount] = useState(initialOrder.total.toFixed(2));
  const [refundMode, setRefundMode] = useState<RefundMode>(initialOrder.paymentProvider === "stripe" ? "automatic" : "manual");
  const [refundMessage, setRefundMessage] = useState("");
  const [pendingStatus, setPendingStatus] = useState<AdminOrderActionStatus | null>(null);
  const [pendingRefund, setPendingRefund] = useState<{ amount: number; mode: RefundMode } | null>(null);
  const actions = getNextOrderActions(order.status);
  const automaticRefundSupported = order.paymentProvider === "stripe";

  function renderActionIcon(next: AdminOrderActionStatus | undefined) {
    if (next === "confirmed") return <CheckCircle2 size={16} />;
    if (next === "in_progress") return <Play size={16} />;
    if (next === "delivered") return <Truck size={16} />;
    if (next === "completed") return <PackageCheck size={16} />;
    if (next === "refunded") return <RotateCcw size={16} />;
    if (next === "deny_refund") return <XCircle size={16} />;
    if (next === "refund_requested") return <RotateCcw size={16} />;
    return null;
  }

  async function applyStatus(next: AdminOrderActionStatus) {
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
      setPendingStatus(null);
    }
  }

  async function issueRefund() {
    if (!pendingRefund) return;

    const amount = pendingRefund.amount;

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Refund amount must be greater than 0.");
      return;
    }

    if (amount > order.total) {
      setError("Refund amount cannot be higher than the order total.");
      return;
    }

    setIsSaving(true);
    setError("");
    setRefundMessage("");

    try {
      const response = await fetch(`/api/admin/orders/${order.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, mode: pendingRefund.mode }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Unable to issue refund.");
        return;
      }

      setRefundMessage(
        payload.manual
          ? "Manual refund recorded."
          : `${order.paymentProvider === "stripe" ? "Stripe" : order.paymentProvider} refund issued${payload.refundId ? `: ${payload.refundId}` : "."}`,
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
      setPendingRefund(null);
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
                  onClick={() => {
                    if (!action.next) return;
                    if (action.next === "refund_requested") {
                      setPendingStatus(action.next);
                      return;
                    }
                    applyStatus(action.next);
                  }}
                  className="w-full"
                  disabled={isSaving}
                >
                  {renderActionIcon(action.next)}
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
                {refundMode === "automatic"
                  ? automaticRefundSupported
                    ? "Automatic refund sends money back through the payment provider. If the provider call fails, MoonStrike will not mark the order as refunded."
                    : "Automatic refunds are not available for this provider. Complete the refund externally, then record it manually."
                  : "Manual refund only records that you already refunded the customer outside MoonStrike. Use it after completing the external refund."}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[var(--ms-text-secondary)]">Refund method</label>
                  <div className="mt-2 grid gap-2">
                    {[
                      {
                        mode: "automatic" as RefundMode,
                        title: "Automatic by provider",
                        detail: automaticRefundSupported ? "Issue through provider API." : "Not available for this provider.",
                      },
                      {
                        mode: "manual" as RefundMode,
                        title: "Manual record",
                        detail: "Use after refunding externally.",
                      },
                    ].map((option) => (
                      <button
                        key={option.mode}
                        type="button"
                        onClick={() => setRefundMode(option.mode)}
                        className={[
                          "rounded-lg border px-3 py-2 text-left text-xs transition",
                          refundMode === option.mode
                            ? "border-[#8B5CF6] bg-[#8B5CF6]/10 text-white"
                            : "border-[var(--ms-accent)] bg-[var(--ms-primary)] text-[var(--ms-text-secondary)] hover:border-[#8B5CF6]",
                        ].join(" ")}
                      >
                        <span className="block font-semibold">{option.title}</span>
                        <span className="mt-1 block text-[#64748B]">{option.detail}</span>
                      </button>
                    ))}
                  </div>
                </div>
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
                onClick={() => {
                  const amount = Number(refundAmount);
                  if (!Number.isFinite(amount) || amount <= 0) {
                    setError("Refund amount must be greater than 0.");
                    return;
                  }
                  if (amount > order.total) {
                    setError("Refund amount cannot be higher than the order total.");
                    return;
                  }
                  if (refundMode === "automatic" && !automaticRefundSupported) {
                    setError("Automatic refunds are not available for this provider. Complete the refund externally, then record it manually.");
                    return;
                  }
                  setError("");
                  setPendingRefund({ amount, mode: refundMode });
                }}
                disabled={isSaving}
              >
                <RotateCcw size={16} />
                {isSaving ? "Issuing..." : refundMode === "automatic" ? "Issue Automatic Refund" : "Record Manual Refund"}
              </AdminButton>
              {refundMessage ? <p className="mt-2 text-xs text-emerald-400">{refundMessage}</p> : null}
            </section>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={pendingStatus === "refund_requested"}
        title="Mark refund requested?"
        description="Delivery work may need to pause while this refund request is reviewed. The order will move into the refund review state."
        confirmLabel="Mark Requested"
        variant="warning"
        isLoading={isSaving}
        onClose={() => {
          if (!isSaving) setPendingStatus(null);
        }}
        onConfirm={() => applyStatus("refund_requested")}
      />

      <ConfirmDialog
        open={pendingRefund !== null}
        title={pendingRefund?.mode === "automatic" ? "Issue provider refund?" : "Record manual refund?"}
        description={
          pendingRefund === null
            ? ""
            : pendingRefund.mode === "automatic"
              ? `This sends ${order.currency} ${pendingRefund.amount.toFixed(2)} back through ${order.paymentProvider} and marks the MoonStrike order as refunded only if the provider confirms success.`
              : `Only continue after you have already sent ${order.currency} ${pendingRefund.amount.toFixed(2)} through ${order.paymentProvider}, a wallet transfer, or another external provider. MoonStrike will only record it.`
        }
        confirmLabel={pendingRefund?.mode === "automatic" ? "Issue Refund" : "Record Refund"}
        variant="danger"
        isLoading={isSaving}
        onClose={() => {
          if (!isSaving) setPendingRefund(null);
        }}
        onConfirm={issueRefund}
      />
    </div>
  );
}
