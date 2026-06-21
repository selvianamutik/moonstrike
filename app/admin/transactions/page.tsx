import { LivePageRefresh } from "@/components/live-page-refresh";
import { listAdminTransactions } from "@/lib/admin/transactions";
import { TransactionsPageClient } from "./TransactionsPageClient";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const { records, stats } = await listAdminTransactions();

  return (
    <>
      <LivePageRefresh intervalMs={10_000} />
      <TransactionsPageClient stats={stats} transactions={records} />
    </>
  );
}
