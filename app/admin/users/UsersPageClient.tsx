"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Ban, CheckCircle2, Eye, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { UserStatusDot } from "@/components/admin/UserStatusDot";
import { ActionTooltip } from "@/components/common/ActionTooltip";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import type { AdminCustomerRecord, AdminCustomerStats, AdminCustomerStatus } from "@/lib/admin/users";

type StatusFilter = "All Status" | AdminCustomerStatus;

export function UsersPageClient({
  customers,
  stats,
}: {
  customers: AdminCustomerRecord[];
  stats: AdminCustomerStats;
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All Status");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [pendingBanAction, setPendingBanAction] = useState<{ customer: AdminCustomerRecord; banned: boolean } | null>(null);
  const [moderationReason, setModerationReason] = useState("");
  const router = useRouter();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesStatus = statusFilter === "All Status" || customer.status === statusFilter;
      const matchesSearch =
        !query ||
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [customers, search, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedCustomers = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const showingFrom = filtered.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const showingTo = filtered.length > 0 ? showingFrom + pagedCustomers.length - 1 : 0;

  async function updateBanStatus(customer: AdminCustomerRecord, banned: boolean) {
    const action = banned ? "ban" : "unban";
    const reason = moderationReason.trim();

    if (banned && reason.length < 3) {
      setActionError("Ban reason is required.");
      return;
    }

    setUpdatingId(customer.id);
    setActionError("");
    try {
      const response = await fetch(`/api/admin/users/${customer.id}/ban`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banned, reason }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? `Failed to ${action} customer.`);
      }
      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : `Failed to ${action} customer.`);
    } finally {
      setUpdatingId(null);
      setPendingBanAction(null);
      setModerationReason("");
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <AdminPageHeader
        breadcrumbs={[{ label: "Management" }, { label: "Users", active: true }]}
        title="Customer Registry"
        description="View storefront customers and their order/payment activity."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <AdminStatCard title="TOTAL CUSTOMERS" value={String(stats.totalUsers)} icon={<Users size={18} className="text-[#8B5CF6]" />} progressColor="bg-[#8B5CF6]" progressWidth="w-[65%]" />
        <AdminStatCard title="VERIFIED EMAILS" value={String(stats.verifiedUsers)} subtitle="Confirmed auth users" icon={<CheckCircle2 size={18} className="text-green-500" />} progressColor="bg-green-500" progressWidth="w-[60%]" />
        <AdminStatCard title="NEW THIS MONTH" value={String(stats.newThisMonth)} subtitle="Fresh signups" icon={<UserPlus size={18} className="text-[#22D3EE]" />} progressColor="bg-[#22D3EE]" progressWidth="w-[45%]" />
        <AdminStatCard title="BANNED ACCOUNTS" value={String(stats.bannedUsers)} subtitle="Blocked sign-ins" icon={<Ban size={18} className="text-amber-500" />} progressColor="bg-amber-500" progressWidth="w-[20%]" />
      </div>

      <AdminFilterBar
        searchPlaceholder="Search name or email..."
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        extra={
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as StatusFilter);
              setPage(1);
            }}
            className="bg-[var(--ms-secondary)] border border-[var(--ms-accent)] text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-[#8B5CF6]"
          >
            <option>All Status</option>
            <option value="active">Active</option>
              <option value="banned">Banned</option>
            </select>
        }
        counter={`Showing ${showingFrom}-${showingTo} of ${filtered.length}`}
      />

      {actionError ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {actionError}
        </p>
      ) : null}

      <AdminDataTable columns={["CUSTOMER", "EMAIL", "STATUS", "ORDERS", "SPENT", "LAST SIGN IN", "ACTIONS"]}>
        {pagedCustomers.map((customer) => (
          <tr key={customer.id} className="hover:bg-[#111827] transition-colors">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <span className={`text-white font-medium ${customer.status === "banned" ? "line-through text-[#64748B]" : ""}`}>
                  {customer.name}
                </span>
              </div>
            </td>
            <td className="px-6 py-4">{customer.email}</td>
            <td className="px-6 py-4">
              <UserStatusDot status={customer.status} />
            </td>
            <td className="px-6 py-4">{customer.orderCount}</td>
            <td className="px-6 py-4 text-white">{customer.totalSpent}</td>
            <td className="px-6 py-4">{customer.lastSignIn}</td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-1">
                <ActionTooltip label="View detail">
                  <Link
                    href={`/admin/users/${customer.slug}`}
                    className="admin-action-icon hover:border-[#22D3EE] hover:text-white"
                    aria-label={`View ${customer.name}`}
                  >
                    <Eye size={15} />
                  </Link>
                </ActionTooltip>
                {customer.status === "banned" ? (
                  <ActionTooltip label="Unban user">
                    <button
                      type="button"
                      onClick={() => {
                        setModerationReason("");
                        setPendingBanAction({ customer, banned: false });
                      }}
                      disabled={updatingId === customer.id}
                      className="admin-action-icon hover:border-green-500 hover:text-green-400 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Unban ${customer.name}`}
                    >
                      <ShieldCheck size={15} />
                    </button>
                  </ActionTooltip>
                ) : (
                  <ActionTooltip label="Ban user">
                    <button
                      type="button"
                      onClick={() => {
                        setModerationReason("");
                        setPendingBanAction({ customer, banned: true });
                      }}
                      disabled={updatingId === customer.id}
                      className="admin-action-icon hover:border-amber-500 hover:text-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Ban ${customer.name}`}
                    >
                      <Ban size={15} />
                    </button>
                  </ActionTooltip>
                )}
              </div>
            </td>
          </tr>
        ))}
      </AdminDataTable>

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

      <ConfirmDialog
        open={Boolean(pendingBanAction)}
        title={pendingBanAction?.banned ? "Ban customer account?" : "Unban customer account?"}
        description={
          pendingBanAction?.banned
            ? `This blocks ${pendingBanAction.customer.email} from signing in until the account is unbanned.`
            : `This restores sign-in access for ${pendingBanAction?.customer.email}.`
        }
        confirmLabel={pendingBanAction?.banned ? "Ban Account" : "Unban Account"}
        variant={pendingBanAction?.banned ? "warning" : "primary"}
        isLoading={Boolean(pendingBanAction && updatingId === pendingBanAction.customer.id)}
        onClose={() => {
          if (!updatingId) {
            setPendingBanAction(null);
            setModerationReason("");
          }
        }}
        onConfirm={() => {
          if (pendingBanAction) updateBanStatus(pendingBanAction.customer, pendingBanAction.banned);
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
            disabled={Boolean(pendingBanAction && updatingId === pendingBanAction.customer.id)}
          />
        </label>
      </ConfirmDialog>
    </div>
  );
}
