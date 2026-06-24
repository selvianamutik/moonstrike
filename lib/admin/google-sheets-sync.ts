import { listAdminOrders } from "@/lib/admin/orders";
import { listAdminTransactions } from "@/lib/admin/transactions";
import { replaceSheetValues } from "@/lib/google-sheets";
import { createAdminClient } from "@/lib/supabase/admin";

export type GoogleSheetsSyncTarget = "orders" | "transactions" | "all";
type GoogleSheetsSyncJobStatus = "pending" | "processing" | "success" | "failed";
type GoogleSheetsSyncJobRow = {
  id: string;
  target: GoogleSheetsSyncTarget;
  attempts: number;
};

function normalizeText(value: string | null | undefined) {
  return value?.trim() || "-";
}

function orderSelectedOptionsSummary(items: Awaited<ReturnType<typeof listAdminOrders>>[number]["items"]) {
  if (items.length === 0) return "-";
  return items
    .map((item) => `${item.serviceName}: ${item.optionsSummary || "No selected options"}`)
    .join(" | ");
}

function orderItemBreakdown(items: Awaited<ReturnType<typeof listAdminOrders>>[number]["items"]) {
  if (items.length === 0) return "-";
  return items
    .map((item) => `${item.serviceName} - ${item.amount}`)
    .join(" | ");
}

function orderRows() {
  return listAdminOrders().then((orders) => [
    [
      "Order ID",
      "Customer",
      "Customer Email",
      "Created At",
      "Updated At",
      "Status",
      "Items",
      "Services",
      "Games",
      "Selected Options",
      "Item Breakdown",
      "Amount",
      "Currency",
      "Payment Provider",
      "Transaction ID",
      "Checkout Session",
    ],
    ...orders.map((order) => [
      order.orderReference,
      order.customerName,
      order.customerEmail,
      order.createdAtIso,
      order.updatedAt,
      order.status,
      order.itemCount,
      order.items.map((item) => item.serviceName).join(", "),
      Array.from(new Set(order.items.map((item) => item.gameName).filter(Boolean))).join(", "),
      orderSelectedOptionsSummary(order.items),
      orderItemBreakdown(order.items),
      order.total,
      order.currency,
      order.paymentProvider,
      normalizeText(order.transactionId),
      order.checkoutSessionId,
    ]),
  ]);
}

function transactionRows() {
  return listAdminTransactions().then(({ records }) => [
    [
      "Transaction ID",
      "Customer",
      "Customer Email",
      "Created At",
      "Amount",
      "Currency",
      "Provider",
      "Status",
      "Checkout Session",
    ],
    ...records.map((transaction) => [
      transaction.id,
      transaction.customerName,
      transaction.customerEmail,
      transaction.dateIso,
      transaction.amountValue,
      transaction.currency,
      transaction.paymentProvider,
      transaction.status,
      transaction.checkoutSessionId,
    ]),
  ]);
}

export async function syncGoogleSheets(target: GoogleSheetsSyncTarget = "all") {
  const results = [];

  if (target === "orders" || target === "all") {
    results.push(await replaceSheetValues("Orders", await orderRows()));
  }

  if (target === "transactions" || target === "all") {
    results.push(await replaceSheetValues("Transactions", await transactionRows()));
  }

  return {
    syncedAt: new Date().toISOString(),
    results,
  };
}

export async function enqueueGoogleSheetsSync(target: GoogleSheetsSyncTarget) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("sheets_sync_jobs").upsert(
    {
      target,
      status: "pending",
      requested_at: now,
      updated_at: now,
      last_error: null,
    },
    { onConflict: "target" },
  );

  if (error) {
    console.error(`Failed to enqueue Google Sheets sync (${target})`, error.message);
  }
}

export async function clearGoogleSheetsSyncJob(target: GoogleSheetsSyncTarget) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const targets = target === "all" ? ["all", "orders", "transactions"] : [target, "all"];

  const { error } = await supabase
    .from("sheets_sync_jobs")
    .update({
      status: "success" satisfies GoogleSheetsSyncJobStatus,
      processed_at: now,
      updated_at: now,
      last_error: null,
    })
    .in("target", targets)
    .eq("status", "pending");

  if (error) {
    console.error(`Failed to clear Google Sheets sync job (${target})`, error.message);
  }
}

async function markJobProcessing(job: GoogleSheetsSyncJobRow) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("sheets_sync_jobs")
    .update({
      status: "processing" satisfies GoogleSheetsSyncJobStatus,
      processing_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attempts: job.attempts + 1,
    })
    .eq("id", job.id);

  if (error) throw error;
}

async function markJobSuccess(job: GoogleSheetsSyncJobRow) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("sheets_sync_jobs")
    .update({
      status: "success" satisfies GoogleSheetsSyncJobStatus,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_error: null,
    })
    .eq("id", job.id);

  if (error) throw error;
}

async function markJobFailed(job: GoogleSheetsSyncJobRow, error: unknown) {
  const supabase = createAdminClient();
  const message = error instanceof Error ? error.message : "Google Sheets sync failed.";
  const { error: updateError } = await supabase
    .from("sheets_sync_jobs")
    .update({
      status: "failed" satisfies GoogleSheetsSyncJobStatus,
      updated_at: new Date().toISOString(),
      last_error: message,
    })
    .eq("id", job.id);

  if (updateError) throw updateError;
}

export async function processPendingGoogleSheetsSyncJobs() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sheets_sync_jobs")
    .select("id, target, attempts")
    .eq("status", "pending")
    .order("requested_at", { ascending: true })
    .returns<GoogleSheetsSyncJobRow[]>();

  if (error) throw error;

  const jobs = data ?? [];
  const results: Array<{ target: GoogleSheetsSyncTarget; status: "success" | "failed"; error?: string }> = [];

  for (const job of jobs) {
    try {
      await markJobProcessing(job);
      await syncGoogleSheets(job.target);
      await markJobSuccess(job);
      results.push({ target: job.target, status: "success" });
    } catch (error) {
      await markJobFailed(job, error);
      results.push({
        target: job.target,
        status: "failed",
        error: error instanceof Error ? error.message : "Google Sheets sync failed.",
      });
    }
  }

  return {
    processedCount: jobs.length,
    successCount: results.filter((result) => result.status === "success").length,
    failedCount: results.filter((result) => result.status === "failed").length,
    results,
  };
}
