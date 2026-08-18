import { NextResponse, type NextRequest } from "next/server";
import { writeAuditLog } from "@/lib/admin/audit";
import { appBaseUrl, renderMoonStrikeEmail, sendEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCheckoutSnapshotItems, type CheckoutSnapshotItem } from "@/lib/checkout/snapshot";
import { calculateTaxAmount, getPaymentTaxRate } from "@/lib/checkout/tax";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REMINDER_AGE_HOURS = 6;
const SESSION_BATCH_LIMIT = 200;

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const vercelCronHeader = request.headers.get("x-vercel-cron");

  if (vercelCronHeader === "1") return true;
  if (!cronSecret) return false;

  return authHeader === `Bearer ${cronSecret}`;
}

type ReminderSessionRow = {
  id: string;
  user_id: string;
  currency: "USD" | "EUR";
  provider: string;
  items: unknown;
  created_at: string;
};

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    await writeAuditLog({
      action: "Invoice reminder cron blocked: unauthorized request",
      status: "blocked",
      request,
      eventType: "cron",
      actorLabel: "System (Cron)",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - REMINDER_AGE_HOURS * 60 * 60 * 1000).toISOString();

  const { data: sessions, error } = await supabase
    .from("checkout_sessions")
    .select("id, user_id, currency, provider, items, created_at")
    .eq("status", "created")
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(SESSION_BATCH_LIMIT)
    .returns<ReminderSessionRow[]>();

  if (error) {
    const message = error.message;
    await writeAuditLog({
      action: `Invoice reminder cron failed: ${message}`,
      status: "critical",
      request,
      eventType: "cron",
      actorLabel: "System (Cron)",
    });
    throw error;
  }

  let remindedCount = 0;
  let alreadyRemindedCount = 0;
  let failedCount = 0;

  for (const session of sessions ?? []) {
    try {
      const notified = await createNotification({
        recipientType: "customer",
        userId: session.user_id,
        eventType: "invoice_reminder",
        title: "Your payment is still pending",
        body: `Order from ${new Date(session.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })} is waiting for payment. Complete it to keep your services reserved.`,
        href: "/checkout",
        metadata: { checkoutSessionId: session.id },
        dedupeKey: `invoice_reminder:${session.id}`,
      });

      if (!notified) {
        alreadyRemindedCount += 1;
        continue;
      }

      const emailSent = await sendReminderEmail(session);
      if (emailSent) remindedCount += 1;
    } catch (reminderError) {
      failedCount += 1;
      console.error(`Invoice reminder failed for session ${session.id}`, reminderError);
    }
  }

  await writeAuditLog({
    action: `Invoice reminder cron completed: ${remindedCount} reminded, ${alreadyRemindedCount} already reminded, ${failedCount} failed`,
    status: failedCount > 0 ? "blocked" : "success",
    request,
    eventType: "cron",
    actorLabel: "System (Cron)",
  });

  return NextResponse.json({
    ok: true,
    remindedCount,
    alreadyRemindedCount,
    failedCount,
    reminderAgeHours: REMINDER_AGE_HOURS,
  });
}

async function sendReminderEmail(session: ReminderSessionRow) {
  const supabase = createAdminClient();

  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(session.user_id);
  const email = userData?.user?.email;

  if (userError || !email) {
    console.warn(`Could not load customer email for ${session.user_id}`);
    return false;
  }

  if (!isCheckoutSnapshotItems(session.items) || session.items.length === 0) {
    return false;
  }

  const serviceNames = (session.items as CheckoutSnapshotItem[]).map((item) => item.product.name);
  const summary = serviceNames.length === 1 ? serviceNames[0] : `${serviceNames[0]} + ${serviceNames.length - 1} more`;

  const basePrice = (session.items as CheckoutSnapshotItem[]).reduce(
    (total, item) => total + (session.currency === "EUR" ? item.priceEUR : item.priceUSD),
    0,
  );
  const taxRate = await getPaymentTaxRate(session.provider);
  const taxAmount = calculateTaxAmount(basePrice, taxRate);
  const total = basePrice + taxAmount;
  const amountLabel = `${session.currency === "EUR" ? "€" : "$"}${total.toFixed(2)} ${session.currency}`;

  const checkoutUrl = `${appBaseUrl()}/checkout`;
  const emailContent = renderMoonStrikeEmail({
    title: "Your payment is still pending",
    body: `You started a checkout for ${summary} (${amountLabel}) but haven't completed payment yet. Your order stays reserved for now — finish your payment to confirm it and keep your spot.`,
    ctaLabel: "Complete your payment",
    ctaHref: checkoutUrl,
    footer: "Need help? Open your order chat or contact MoonStrike support.",
  });

  const result = await sendEmail({
    to: email,
    subject: `Complete your MoonStrike payment - ${amountLabel}`,
    text: emailContent.text,
    html: emailContent.html,
  });

  if (!result.sent) {
    console.warn(`Skipped invoice reminder email for ${session.id}: ${result.skippedReason}`);
    return false;
  }

  return true;
}
