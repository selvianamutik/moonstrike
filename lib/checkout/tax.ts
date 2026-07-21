import { createAdminClient } from "@/lib/supabase/admin";

export async function getPaymentTaxRate(provider: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("payment_settings")
    .select("tax_rate")
    .eq("method", provider)
    .maybeSingle<{ tax_rate: number }>();
  return data?.tax_rate ?? 0;
}

export function calculateTaxAmount(subtotal: number, taxRate: number) {
  return Number((subtotal * taxRate).toFixed(2));
}
