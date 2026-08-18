import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { getAdminSession } from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/admin/audit";
import { fulfillNowPaymentsCheckout } from "@/lib/checkout/nowpayments-fulfillment";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TestPaymentRequestBody = {
  userEmail?: string;
  serviceIds?: string[];
  amount?: number;
  currency?: "USD" | "EUR";
};

async function findUserIdByEmail(email: string) {
  const supabase = createAdminClient();
  const normalized = email.trim().toLowerCase();
  let page = 1;

  while (page <= 50) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return { error: new Error(error.message) };

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === normalized);
    if (user) return { userId: user.id };

    if (data.users.length < 1000) break;
    page += 1;
  }

  return { error: new Error(`No customer found with the email "${email}".`) };
}

async function findServiceByIds(ids: string[]) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, title")
    .in("id", ids)
    .returns<Array<{ id: string; title: string }>>();

  if (error) return { error: new Error(error.message) };

  const found = new Map(data.map((service) => [service.id, service.title]));
  const missing = ids.filter((id) => !found.has(id));

  if (missing.length > 0) {
    return { error: new Error(`No service found for ${missing.length} selected id(s).`) };
  }

  const ordered = ids.map((id) => ({ id, title: found.get(id)! }));
  return { services: ordered };
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (admin.role !== "super_admin") {
    return NextResponse.json(
      { error: "Insufficient permissions. Only super admins can run payment simulations." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as TestPaymentRequestBody;
  const userEmail = typeof body.userEmail === "string" ? body.userEmail.trim() : "";
  const serviceIds = Array.isArray(body.serviceIds) ? body.serviceIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0) : [];
  const amount = Number(body.amount);
  const currency = body.currency === "EUR" ? "EUR" : "USD";

  if (!userEmail) {
    return NextResponse.json({ error: "A customer email is required." }, { status: 400 });
  }

  if (serviceIds.length === 0) {
    return NextResponse.json({ error: "At least one service is required." }, { status: 400 });
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "A positive amount is required." }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    const userLookup = await findUserIdByEmail(userEmail);
    if (userLookup.error) throw userLookup.error;

    const serviceLookup = await findServiceByIds(serviceIds);
    if (serviceLookup.error) throw serviceLookup.error;
    const serviceRows = serviceLookup.services!;

    const { data: cart, error: cartError } = await supabase
      .from("carts")
      .insert({ session_id: `test_${randomUUID()}` })
      .select("id")
      .single<{ id: string }>();

    if (cartError) throw cartError;

    const checkoutSessionId = `test_${randomUUID()}`;
    const items = serviceRows.map((service) => ({
      cartItemId: randomUUID(),
      serviceId: service.id,
      selectedOptions: {},
      selectedOptionsSnapshot: {},
      priceUSD: amount,
      priceEUR: amount,
      product: { name: service.title },
    }));

    const { error: sessionError } = await supabase.from("checkout_sessions").insert({
      id: checkoutSessionId,
      cart_id: cart.id,
      user_id: userLookup.userId,
      currency,
      provider: "nowpayments",
      status: "created",
      items,
    });

    if (sessionError) throw sessionError;

    const fulfillment = await fulfillNowPaymentsCheckout({
      payment_id: `test_${randomUUID()}`,
      order_id: checkoutSessionId,
      payment_status: "finished",
      price_amount: amount,
      price_currency: currency.toLowerCase(),
      pay_amount: amount,
      pay_currency: currency.toLowerCase(),
    });

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_ref")
      .eq("checkout_session_id", checkoutSessionId)
      .maybeSingle<{ id: string; order_ref: string }>();

    if (orderError) throw orderError;

    await writeAuditLog({
      action: `Test payment simulated for ${userEmail}: ${checkoutSessionId} (status ${fulfillment.status}, ${fulfillment.orderCount} item(s))`,
      status: "success",
      request,
      admin,
      eventType: "admin_action",
    });

    return NextResponse.json({
      ok: true,
      checkoutSessionId,
      fulfillmentStatus: fulfillment.status,
      orderCount: fulfillment.orderCount,
      orderId: order?.id ?? null,
      orderRef: order?.order_ref ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Test payment simulation failed.";

    await writeAuditLog({
      action: `Test payment simulation failed: ${message}`,
      status: "critical",
      request,
      admin,
      eventType: "admin_action",
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}