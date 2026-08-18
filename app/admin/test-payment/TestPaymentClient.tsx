"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, FlaskConical, Loader2, Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminFormField, adminInputClass, adminSelectClass } from "@/components/admin/AdminFormField";

export type TestPaymentServiceOption = {
  id: string;
  title: string;
  gameName: string;
};

type SimulationResult = {
  checkoutSessionId?: string;
  fulfillmentStatus?: string;
  orderCount?: number;
  orderId?: string | null;
  orderRef?: string | null;
};

export function TestPaymentClient({ services }: { services: TestPaymentServiceOption[] }) {
  const [userEmail, setUserEmail] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([""]);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"USD" | "EUR">("USD");
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<SimulationResult | null>(null);

  function updateSelection(index: number, value: string) {
    setSelectedIds((current) => current.map((id, i) => (i === index ? value : id)));
  }

  function addServiceRow() {
    setSelectedIds((current) => [...current, ""]);
  }

  function removeServiceRow(index: number) {
    setSelectedIds((current) => current.filter((_, i) => i !== index));
  }

  async function handleSimulate() {
    if (status === "running") return;

    const serviceIds = selectedIds.filter((id) => id.trim());
    if (serviceIds.length === 0) {
      setStatus("error");
      setMessage("Select at least one service.");
      return;
    }

    setStatus("running");
    setMessage("");
    setResult(null);

    try {
      const response = await fetch("/api/admin/test-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail,
          serviceIds,
          amount: Number(amount),
          currency,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus("error");
        setMessage(payload.error ?? "Simulation failed.");
        return;
      }

      setStatus("success");
      setResult(payload as SimulationResult);
      setMessage("Payment simulated successfully. Order created and emails triggered.");
    } catch {
      setStatus("error");
      setMessage("Unable to reach the simulation service.");
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={[
          { label: "Home" },
          { label: "Test Payment", active: true },
        ]}
        title="Test Payment"
        description="Simulate a successful NOWPayments payment for a real customer without touching any live gateway. An order, transaction, and payment-confirmed email are created exactly like a real webhook."
      />

      <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
        <h2 className="mb-1 text-lg font-bold text-white">Payment simulation</h2>
        <p className="mb-6 text-sm text-[var(--admin-muted)]">
          Pick one or more services from the catalog, then run the simulation.
        </p>

        <div className="flex flex-col gap-5">
          <AdminFormField label="Customer email">
            <input
              type="email"
              className={adminInputClass}
              value={userEmail}
              onChange={(event) => setUserEmail(event.target.value)}
              placeholder="customer@example.com"
              required
            />
          </AdminFormField>

          <AdminFormField label="Services">
            <div className="flex flex-col gap-3">
              {selectedIds.map((selectedId, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    className={adminSelectClass}
                    value={selectedId}
                    onChange={(event) => updateSelection(index, event.target.value)}
                  >
                    <option value="">Select a service...</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.title} ({service.gameName})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeServiceRow(index)}
                    disabled={selectedIds.length === 1}
                    className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg border border-[var(--admin-border)] text-[var(--admin-muted)] transition-colors hover:border-[var(--ms-danger)] hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Remove service"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addServiceRow}
                className="flex w-fit items-center gap-2 rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm font-medium text-[var(--admin-muted)] transition-colors hover:border-[var(--admin-accent)] hover:text-white"
              >
                <Plus size={15} />
                Add another service
              </button>
            </div>
          </AdminFormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <AdminFormField label="Amount per service">
              <input
                type="number"
                min="0.01"
                step="0.01"
                className={adminInputClass}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="49.99"
                required
              />
            </AdminFormField>

            <AdminFormField label="Currency">
              <select className={adminSelectClass} value={currency} onChange={(event) => setCurrency(event.target.value as "USD" | "EUR")}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </AdminFormField>
          </div>

          <div className="flex items-center gap-3 border-t border-[var(--admin-border)] pt-5">
            <button
              type="button"
              onClick={handleSimulate}
              disabled={status === "running"}
              className="flex items-center gap-2 rounded-lg bg-[var(--admin-accent)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#7c4ef0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "running" ? <Loader2 size={16} className="animate-spin" /> : <FlaskConical size={16} />}
              {status === "running" ? "Simulating..." : "Simulate successful payment"}
            </button>
            {status === "running" ? (
              <span className="text-xs text-[var(--admin-muted)]">
                Creating checkout snapshot, order, transaction, notification, and email...
              </span>
            ) : null}
          </div>
        </div>

        {message ? (
          <div
            className={`mt-6 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
              status === "success"
                ? "border-green-500/30 bg-green-500/10 text-green-300"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {status === "success" ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertTriangle size={16} className="shrink-0" />}
            <span>{message}</span>
          </div>
        ) : null}

        {result?.orderRef ? (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-[#172554] bg-[#0B1120] p-5 text-sm">
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#22D3EE]">Simulation result</h3>
            <div className="grid gap-2 text-[var(--admin-muted)] sm:grid-cols-2">
              <span>
                Order: <span className="font-mono text-white">{result.orderRef}</span>
              </span>
              <span>
                Checkout: <span className="font-mono text-white">{result.checkoutSessionId}</span>
              </span>
              <span>
                Fulfillment: <span className="font-mono text-white">{result.fulfillmentStatus}</span>
              </span>
              <span>
                Items: <span className="font-mono text-white">{result.orderCount}</span>
              </span>
            </div>
            <p className="text-xs text-[#64748B]">
              The customer received a "Payment received" email, and admins received a "New order received" notification. Verify the order in{" "}
              <a className="text-[#22D3EE] hover:text-white" href={`/admin/orders/${result.orderRef}`}>
                /admin/orders/{result.orderRef}
              </a>
              .
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}