import { listAdminTransactions } from "@/lib/admin/transactions";
import { TransactionsPageClient } from "./TransactionsPageClient";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const { records, stats } = await listAdminTransactions();

  return <TransactionsPageClient stats={stats} transactions={records} />;
}
