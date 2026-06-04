import { createAdminClient } from "@/lib/supabase/admin";

export type CustomerTransaction = {
  id: string;
  checkoutSessionId: string;
  amount: number;
  currency: "USD" | "EUR";
  method: string;
  provider: string;
  status: string;
  createdAt: string;
};

type CustomerTransactionRow = {
  provider_payment_id: string;
  checkout_session_id: string;
  amount: number | string;
  currency: "USD" | "EUR";
  method: string;
  provider: string;
  status: string;
  created_at: string;
};

export async function listCustomerTransactions(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("provider_payment_id, checkout_session_id, amount, currency, method, provider, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<CustomerTransactionRow[]>();

  if (error) throw error;

  return (data ?? []).map((transaction) => ({
    id: transaction.provider_payment_id,
    checkoutSessionId: transaction.checkout_session_id,
    amount: Number(transaction.amount),
    currency: transaction.currency,
    method: transaction.method,
    provider: transaction.provider,
    status: transaction.status,
    createdAt: transaction.created_at,
  }));
}

export function formatTransactionMoney(value: number, currency: "USD" | "EUR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}
