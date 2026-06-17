"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Ban, CheckCircle2, ChevronDown, Clock, CreditCard, Package, ReceiptText, RotateCcw, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { StatusBadge, type StatusType } from "@/components/admin/StatusBadge";
import { UserStatusDot } from "@/components/admin/UserStatusDot";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import type { AdminCustomerDetail } from "@/lib/admin/users";

export function UserDetailView({ user }: { user: AdminCustomerDetail }) {
  const [pendingBanAction, setPendingBanAction] = useState<{ banned: boolean } | null>(null);
  const [moderationReason, setModerationReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionError, setActionError] = useState("");
  const router = useRouter();
  const isBanned = user.status === "banned";

  async function updateBanStatus(banned: boolean) {
    const reason = moderationReason.trim();

    if (banned && reason.length < 3) {
      setActionError("Ban reason is required.");
      return;
    }

    setIsUpdating(true);
    setActionError("");
    try {
      const response = await fetch(`/api/admin/users/${user.id}/ban`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banned, reason }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? `Failed to ${banned ? "ban" : "unban"} customer.`);
      }

      setPendingBanAction(null);
      setModerationReason("");
      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : `Failed to ${banned ? "ban" : "unban"} customer.`);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Users", href: "/admin/users" }, { label: user.name, active: true }]}
        title={user.name}
        description="Customer profile from Supabase Auth with MoonStrike order activity."
        actions={
          <Link href="/admin/users" className="flex items-center gap-2 text-sm text-[var(--ms-text-secondary)] hover:text-white">
            <ArrowLeft size={16} /> Back
          </Link>
        }
      />

      <section className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] rounded-xl p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[var(--ms-accent)] border-2 border-[#22D3EE]/30 flex items-center justify-center text-xl font-bold text-white">
              {user.avatarInitials}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-semibold text-white">{user.name}</h2>
                <UserStatusDot status={user.status} />
              </div>
              <p className="text-[var(--ms-text-secondary)] text-sm">{user.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
            <button
              type="button"
              onClick={() => {
                setActionError("");
                setModerationReason("");
                setPendingBanAction({ banned: !isBanned });
              }}
              className={`admin-action-button rounded-lg border px-3 py-2 text-xs font-semibold uppercase transition-colors ${
                isBanned
                  ? "border-green-500/40 bg-green-500/10 text-green-300 hover:bg-green-500/20"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
              }`}
            >
              {isBanned ? <ShieldCheck size={15} /> : <Ban size={15} />}
              {isBanned ? "Unban" : "Ban"}
            </button>
            <div className="flex flex-wrap gap-2">
              {user.providers.map((provider) => (
                <span
                  key={provider}
                  className="rounded-lg border border-[var(--ms-accent)] bg-[#0B1120] px-3 py-1 text-xs font-semibold uppercase text-[#22D3EE]"
                >
                  {provider}
                </span>
              ))}
            </div>
          </div>
        </div>

        {actionError ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {actionError}
          </p>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <InfoRow label="Email verified" value={user.emailVerified ? "Yes" : "No"} />
          <InfoRow label="Created" value={user.createdAt} />
          <InfoRow label="Last sign in" value={user.lastSignIn} />
          <InfoRow label="Customer ID" value={user.id} />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <AdminStatCard title="TOTAL ORDERS" value={String(user.orderCount)} icon={<Package size={18} className="text-[#8B5CF6]" />} progressColor="bg-[#8B5CF6]" progressWidth="w-[55%]" />
        <AdminStatCard title="ACTIVE ORDERS" value={String(user.activeOrderCount)} icon={<Clock size={18} className="text-[#22D3EE]" />} progressColor="bg-[#22D3EE]" progressWidth="w-[45%]" />
        <AdminStatCard title="COMPLETED ORDERS" value={String(user.orderSummary.completedOrders)} icon={<CheckCircle2 size={18} className="text-green-500" />} progressColor="bg-green-500" progressWidth="w-[60%]" />
        <AdminStatCard title="TOTAL SPENT" value={user.totalSpent} icon={<CreditCard size={18} className="text-green-500" />} progressColor="bg-green-500" progressWidth="w-[60%]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <AdminStatCard title="REFUND REQUESTS" value={String(user.orderSummary.refundRequests)} subtitle="Currently awaiting review" icon={<ShieldCheck size={18} className="text-amber-500" />} progressColor="bg-amber-500" />
        <AdminStatCard title="REFUNDED ORDERS" value={String(user.orderSummary.refundedOrders)} subtitle={user.orderSummary.totalRefunded} icon={<RotateCcw size={18} className="text-[#22D3EE]" />} progressColor="bg-[#22D3EE]" />
        <AdminStatCard title="REJECTED REFUNDS" value={String(user.orderSummary.rejectedRefunds)} subtitle="Denied refund attempts" icon={<AlertTriangle size={18} className="text-amber-500" />} progressColor="bg-amber-500" />
        <AdminStatCard title="BAN EVENTS" value={String(user.moderationEvents.filter((event) => event.action === "banned").length)} subtitle="Recorded account bans" icon={<Ban size={18} className="text-red-500" />} progressColor="bg-red-500" />
      </div>

      <AdminDataTable columns={["ORDER", "DATE", "ITEMS", "TOTAL", "STATUS"]} title="Recent Orders">
        {user.recentOrders.length > 0 ? (
          user.recentOrders.map((order) => (
            <tr key={order.id} className="hover:bg-[#111827] transition-colors">
              <td className="px-6 py-4">
                <Link href={`/admin/orders/${order.orderRef}`} className="font-mono text-sm font-semibold text-white hover:text-[#22D3EE]">
                  {order.orderRef}
                </Link>
              </td>
              <td className="px-6 py-4 text-sm">{order.createdAt}</td>
              <td className="px-6 py-4 text-sm">{order.itemCount}</td>
              <td className="px-6 py-4 text-sm text-white">{order.total}</td>
              <td className="px-6 py-4"><StatusBadge status={order.status as StatusType} /></td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={5} className="px-6 py-8 text-sm text-[var(--ms-text-secondary)]">No orders found for this customer yet.</td>
          </tr>
        )}
      </AdminDataTable>

      <AdminDataTable columns={["TRANSACTION", "PROVIDER", "DATE", "AMOUNT", "STATUS", "REFUND"]} title="Recent Transactions">
        {user.recentTransactions.length > 0 ? (
          user.recentTransactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-[#111827] transition-colors">
              <td className="px-6 py-4">
                <Link href={`/admin/transactions/${transaction.id}`} className="inline-flex items-center gap-2 font-mono text-sm font-semibold text-white hover:text-[#22D3EE]">
                  <ReceiptText size={14} />
                  {transaction.id}
                </Link>
              </td>
              <td className="px-6 py-4 text-sm capitalize">{transaction.provider}</td>
              <td className="px-6 py-4 text-sm">{transaction.createdAt}</td>
              <td className="px-6 py-4 text-sm text-white">{transaction.amount}</td>
              <td className="px-6 py-4"><StatusBadge status={transaction.status as StatusType} /></td>
              <td className="px-6 py-4 text-sm capitalize">{transaction.refundStatus.replace(/_/g, " ")}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={6} className="px-6 py-8 text-sm text-[var(--ms-text-secondary)]">No transactions found for this customer yet.</td>
          </tr>
        )}
      </AdminDataTable>

      <details className="group rounded-xl border border-[var(--ms-accent)] bg-[var(--ms-secondary)] p-6">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Customer Activity</h2>
            <p className="mt-1 text-sm text-[var(--ms-text-secondary)]">Recent order, payment, and moderation events.</p>
          </div>
          <ChevronDown size={18} className="shrink-0 text-[#94A3B8] transition-transform group-open:rotate-180 group-open:text-white" />
        </summary>

        {user.activityTimeline.length > 0 ? (
          <div className="mt-5 space-y-4 border-t border-[var(--ms-accent)] pt-5">
            {user.activityTimeline.map((event) => (
              <div key={event.id} className="relative border-l border-[#172554] pl-5">
                <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#22D3EE]" />
                <div className="flex flex-col gap-2 rounded-lg border border-[#172554] bg-[#0B1120] p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {event.href ? (
                        <Link href={event.href} className="font-semibold text-white hover:text-[#22D3EE]">
                          {event.title}
                        </Link>
                      ) : (
                        <p className="font-semibold capitalize text-white">{event.title}</p>
                      )}
                      <span className="rounded-md border border-[#172554] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#94A3B8]">
                        {event.type}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--ms-text-secondary)]">{event.description}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                    <StatusBadge status={event.status as StatusType} />
                    <span className="text-xs text-[#64748B]">{event.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-lg border border-[#172554] bg-[#0B1120] px-4 py-6 text-sm text-[var(--ms-text-secondary)]">
            No activity found for this customer yet.
          </p>
        )}
      </details>

      <AdminDataTable columns={["ACTION", "TIME", "ADMIN", "REASON"]} title="Ban History">
        {user.moderationEvents.length > 0 ? (
          user.moderationEvents.map((event) => (
            <tr key={event.id} className="hover:bg-[#111827] transition-colors">
              <td className="px-6 py-4"><StatusBadge status={event.action === "banned" ? "banned" : "active"} /></td>
              <td className="px-6 py-4 text-sm">{event.createdAt}</td>
              <td className="px-6 py-4 text-sm text-white">{event.adminLabel}</td>
              <td className="px-6 py-4 text-sm text-[var(--ms-text-secondary)]">{event.reason || "-"}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={4} className="px-6 py-8 text-sm text-[var(--ms-text-secondary)]">No moderation history for this customer.</td>
          </tr>
        )}
      </AdminDataTable>

      <ConfirmDialog
        open={Boolean(pendingBanAction)}
        title={pendingBanAction?.banned ? "Ban customer account?" : "Unban customer account?"}
        description={
          pendingBanAction?.banned
            ? `This blocks ${user.email} from signing in until the account is unbanned.`
            : `This restores sign-in access for ${user.email}.`
        }
        confirmLabel={pendingBanAction?.banned ? "Ban Account" : "Unban Account"}
        variant={pendingBanAction?.banned ? "warning" : "primary"}
        isLoading={isUpdating}
        onClose={() => {
          if (!isUpdating) {
            setPendingBanAction(null);
            setModerationReason("");
            setActionError("");
          }
        }}
        onConfirm={() => {
          if (pendingBanAction) updateBanStatus(pendingBanAction.banned);
        }}
      >
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-[#94A3B8]">
            {pendingBanAction?.banned ? "Ban reason" : "Unban note"}
          </span>
          <textarea
            value={moderationReason}
            onChange={(event) => setModerationReason(event.target.value)}
            placeholder={pendingBanAction?.banned ? "Reason is required..." : "Optional note..."}
            className="min-h-[96px] w-full rounded-lg border border-[#172554] bg-[#050816] px-3 py-2 text-sm text-white outline-none transition focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
            disabled={isUpdating}
          />
        </label>
      </ConfirmDialog>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--ms-accent)] bg-[#0B1120] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--ms-text-secondary)]">{label}</p>
      <p className="mt-1 break-all text-sm font-medium text-white">{value}</p>
    </div>
  );
}
