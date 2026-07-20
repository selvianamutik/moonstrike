import { createAdminClient } from "@/lib/supabase/admin";

export type PaymentSettingRow = {
  id: string;
  method: string;
  enabled: boolean;
  tax_rate: number;
  tax_label: string;
  updated_at: string;
};

export async function getPaymentSettings() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payment_settings")
    .select("*")
    .order("method", { ascending: true });

  if (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error.code === "42P01" || error.code === "PGRST116")
    ) {
      return [];
    }
    console.error("getPaymentSettings error:", error);
    return [];
  }

  if (!data) return [];

  return data.map((row: Record<string, unknown>) => ({
    id: String(row.id ?? ""),
    method: String(row.method ?? ""),
    enabled: Boolean(row.enabled),
    tax_rate: Number(row.tax_rate) || 0,
    tax_label: String(row.tax_label ?? "Tax"),
    updated_at: String(row.updated_at ?? ""),
  })) as PaymentSettingRow[];
}

export async function updatePaymentSetting(method: string, updates: Partial<PaymentSettingRow>) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("payment_settings")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("method", method);

  if (error) throw error;
  return { ok: true };
}
