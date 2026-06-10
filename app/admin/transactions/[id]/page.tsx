import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { AdminButton } from "@/components/admin/AdminButton";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge, type StatusType } from "@/components/admin/StatusBadge";
import { getAdminTransaction } from "@/lib/admin/transactions";

type AdminTransactionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function AdminTransactionDetailPage({ params }: AdminTransactionDetailPageProps) {
  const { id } = await params;
  const transaction = await getAdminTransaction(id);

  if (!transaction) notFound();

  const hasRefund =
    transaction.refundStatus !== "none" ||
    Boolean(transaction.providerRefundId || transaction.refundAmount || transaction.refundedAt);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <AdminPageHeader
        breadcrumbs={[
          { label: "Management" },
          { label: "Transactions", href: "/admin/transactions" },
          { label: transaction.id, active: true },
        ]}
        title="Transaction Detail"
        description="Payment and order references for this checkout transaction."
        actions={
          <Link href="/admin/transactions" className="flex items-center gap-2 text-sm text-[var(--ms-text-secondary)] hover:text-white">
            <ArrowLeft size={16} /> Back
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          <section className="rounded-xl border border-[var(--ms-accent)] bg-[var(--ms-secondary)] p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--ms-text-secondary)]">Transaction ID</p>
                <h1 className="mt-2 break-all font-mono text-2xl font-bold text-white">{transaction.id}</h1>
              </div>
              <StatusBadge status={transaction.status as StatusType} />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <InfoCell label="Provider" value={transaction.method} />
              <InfoCell label="Amount" value={transaction.amount} highlight />
              <InfoCell label="Payment Status" value={transaction.status.replace("_", " ")} />
              <InfoCell label="Refund Status" value={transaction.refundStatus.replace("_", " ")} />
              <InfoCell label="Created" value={transaction.date} />
              <InfoCell label="Updated" value={transaction.updatedAt} />
            </div>
          </section>

          <section className="rounded-xl border border-[var(--ms-accent)] bg-[var(--ms-secondary)] p-6">
            <h2 className="text-lg font-bold text-white">Order & Customer</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <InfoCell label="Order ID" value={transaction.orderReference ?? "Not created yet"} />
              <InfoCell label="Order Status" value={transaction.orderStatus?.replace("_", " ") ?? "Not created yet"} />
              <InfoCell label="Customer Email" value={transaction.customerEmail} />
              <InfoCell label="Customer Name" value={transaction.customerName} />
            </div>
          </section>

          <section className="rounded-xl border border-[var(--ms-accent)] bg-[var(--ms-secondary)] p-6">
            <h2 className="text-lg font-bold text-white">Provider References</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <InfoCell label="Provider Payment ID" value={transaction.providerPaymentId} />
              <InfoCell label="Provider Session ID" value={transaction.providerSessionId ?? "Not provided"} />
              <InfoCell label="Checkout Session" value={transaction.checkoutSessionId} />
            </div>
          </section>

          {hasRefund ? (
            <section className="rounded-xl border border-[var(--ms-accent)] bg-[var(--ms-secondary)] p-6">
              <h2 className="text-lg font-bold text-white">Refund Information</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <InfoCell label="Refund Status" value={transaction.refundStatus.replace("_", " ")} />
                <InfoCell label="Refund Amount" value={transaction.refundAmount ?? "Pending"} />
                <InfoCell label="Provider Refund ID" value={transaction.providerRefundId ?? "Pending"} />
                <InfoCell label="Refunded At" value={transaction.refundedAt ?? "Pending"} />
              </div>
            </section>
          ) : null}

          <details className="rounded-xl border border-[var(--ms-accent)] bg-[var(--ms-secondary)] p-6">
            <summary className="cursor-pointer list-none text-lg font-bold text-white">Debug Information</summary>
            <div className="mt-5 grid gap-4">
              <InfoCell label="Database UUID" value={transaction.databaseId} muted />
              <pre className="max-h-[420px] overflow-auto rounded-lg border border-[var(--ms-accent)] bg-[var(--ms-primary)] p-4 text-xs leading-5 text-[var(--ms-text-secondary)]">
                {JSON.stringify(transaction.rawProviderPayload, null, 2)}
              </pre>
            </div>
          </details>
        </div>

        <aside className="flex flex-col gap-4">
          <section className="rounded-xl border border-[var(--ms-accent)] bg-[var(--ms-secondary)] p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--ms-text-secondary)]">Current Status</p>
            <div className="mt-3">
              <StatusBadge status={transaction.status as StatusType} className="text-sm" />
            </div>
            <div className="mt-6 space-y-3 text-sm">
              <SideRow label="Provider" value={transaction.method} />
              <SideRow label="Amount" value={transaction.amount} />
              <SideRow label="Order" value={transaction.orderReference ?? "Not created"} />
            </div>
          </section>

          <section className="rounded-xl border border-[var(--ms-accent)] bg-[var(--ms-secondary)] p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--ms-text-secondary)]">Actions</p>
            <div className="mt-4 flex flex-col gap-3">
              <AdminButton href="/admin/transactions" variant="secondary" className="w-full">
                <ArrowLeft size={16} />
                Back to Transactions
              </AdminButton>
              {transaction.orderReference ? (
                <AdminButton href={`/admin/orders/${transaction.orderReference}`} className="w-full">
                  <Eye size={16} />
                  View Related Order
                </AdminButton>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function InfoCell({ label, value, highlight = false, muted = false }: { label: string; value: string; highlight?: boolean; muted?: boolean }) {
  return (
    <div className="rounded-lg border border-[var(--ms-accent)] bg-[var(--ms-primary)] p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-[#64748B]">{label}</p>
      <p className={`mt-2 break-all font-mono text-sm ${highlight ? "text-[#22D3EE]" : muted ? "text-[#64748B]" : "text-white"}`}>{value}</p>
    </div>
  );
}

function SideRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--ms-accent)] pb-3 last:border-0 last:pb-0">
      <span className="text-[var(--ms-text-secondary)]">{label}</span>
      <span className="break-all text-right font-mono text-white">{value}</span>
    </div>
  );
}
