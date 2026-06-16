import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { LivePageRefresh } from "@/components/live-page-refresh";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireVerifiedUser } from "@/lib/auth/session";
import { formatMemberSince, getUserDisplayName, getUserInitials } from "@/lib/auth/user-display";
import { formatOrderDateTime, formatPaymentProvider } from "@/lib/orders";
import { formatTransactionMoney, getCustomerTransaction } from "@/lib/transactions";

type ProfileTransactionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function ProfileTransactionDetailPage({ params }: ProfileTransactionDetailPageProps) {
  const user = await requireVerifiedUser("/profile/transactions");
  const { id } = await params;
  const transaction = await getCustomerTransaction(user.id, id);

  if (!transaction) notFound();

  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(displayName, user.email);
  const memberSince = formatMemberSince(user.created_at);
  const refundAmount =
    transaction.refundAmount !== null && transaction.refundCurrency
      ? formatTransactionMoney(transaction.refundAmount, transaction.refundCurrency)
      : null;
  const hasRefund = transaction.refundStatus !== "none" || Boolean(transaction.providerRefundId || refundAmount || transaction.refundedAt);

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <LivePageRefresh intervalMs={10_000} />
      <SiteHeader />
      <section className="ms-shell grid gap-8 py-16 lg:grid-cols-[270px_minmax(0,1fr)]">
        <ProfileSidebar displayName={displayName} email={user.email} initials={initials} memberSince={memberSince} />

        <div>
          <div className="flex flex-col justify-between gap-5 border-b border-[var(--ms-border)] pb-7 md:flex-row md:items-end">
            <div>
              <p className="mono text-xs uppercase tracking-[0.28em] text-[var(--ms-gradient-end)]">
                Profile / Transaction Detail / {transaction.id}
              </p>
              <h1 className="font-display mt-3 text-4xl font-black tracking-[-0.05em]">Transaction Detail</h1>
              <p className="mt-3 text-[var(--ms-body)]">{transaction.id}</p>
            </div>
            <span className="w-fit rounded-full border border-[var(--ms-gradient-end)]/50 px-4 py-2 mono text-sm uppercase text-[var(--ms-success)]">
              {transaction.status.replace("_", " ")}
            </span>
          </div>

          <section className="mt-8 rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-6">
            <h2 className="text-xl font-black">Transaction Information</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <InfoRow label="Transaction ID" value={transaction.id} />
              <InfoRow label="Order ID" value={transaction.orderReference ?? "Not created yet"} href={transaction.orderReference ? `/profile/orders/${transaction.orderReference}` : undefined} />
              <InfoRow label="Provider" value={formatPaymentProvider(transaction.provider)} />
              <InfoRow label="Amount" value={formatTransactionMoney(transaction.amount, transaction.currency)} />
              <InfoRow label="Payment Status" value={transaction.status.replace("_", " ")} />
              <InfoRow label="Refund Status" value={transaction.refundStatus.replace("_", " ")} />
              <InfoRow label="Created" value={formatOrderDateTime(transaction.createdAt)} />
              <InfoRow label="Payment Reference" value={transaction.providerPaymentId} />
            </div>
          </section>

          {hasRefund ? (
            <section className="mt-8 rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] p-6">
              <h2 className="text-xl font-black">Refund Information</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <InfoRow label="Refund Status" value={transaction.refundStatus.replace("_", " ")} />
                <InfoRow label="Refund Amount" value={refundAmount ?? "Pending"} />
                <InfoRow label="Refunded At" value={transaction.refundedAt ? formatOrderDateTime(transaction.refundedAt) : "Pending"} />
                <InfoRow label="Refund Reference" value={transaction.providerRefundId ?? "Pending"} />
              </div>
            </section>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/profile/transactions" className="ms-action-button inline-flex h-11 items-center rounded-md border border-[var(--ms-border)] px-5 text-sm text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-heading)]">
              <ArrowLeft size={16} />
              Back to Transactions
            </Link>
            {transaction.orderReference ? (
              <Link href={`/profile/orders/${transaction.orderReference}`} className="ms-button inline-flex h-11 items-center px-5 mono text-xs uppercase tracking-[0.14em]">
                <Eye size={16} />
                View Order
              </Link>
            ) : null}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function InfoRow({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <>
      <p className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--ms-body)]">{label}</p>
      <p className="mt-2 break-all font-bold capitalize text-[var(--ms-heading)]">{value}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="rounded-lg border border-[var(--ms-border)] bg-black/20 p-4 hover:border-[var(--ms-gradient-end)]">
        {content}
      </Link>
    );
  }

  return <div className="rounded-lg border border-[var(--ms-border)] bg-black/20 p-4">{content}</div>;
}
