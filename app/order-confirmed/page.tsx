import Link from "next/link";
import { notFound } from "next/navigation";
import { PlaceholderAsset } from "@/components/asset-image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireVerifiedUser } from "@/lib/auth/session";
import { fulfillStripeCheckoutSession } from "@/lib/checkout/stripe-fulfillment";
import { formatOrderMoney, formatOrderOptionValue, getCustomerOrderByCheckoutSession } from "@/lib/orders";
import { createAdminClient } from "@/lib/supabase/admin";

type OrderConfirmedPageProps = {
  searchParams: Promise<{ session?: string }>;
};

export const dynamic = "force-dynamic";

export default async function OrderConfirmedPage({ searchParams }: OrderConfirmedPageProps) {
  const user = await requireVerifiedUser("/order-confirmed");
  const { session } = await searchParams;

  if (!session) {
    notFound();
  }

  let order = await getCustomerOrderByCheckoutSession(user.id, session);

  if (!order && session.startsWith("cs_")) {
    const supabase = createAdminClient();
    const { data: checkoutSession } = await supabase
      .from("checkout_sessions")
      .select("user_id")
      .eq("id", session)
      .maybeSingle<{ user_id: string }>();

    if (checkoutSession?.user_id === user.id) {
      await fulfillStripeCheckoutSession(session).catch((fulfillmentError) => {
        console.error("Failed to fulfill Stripe checkout session from confirmation page", fulfillmentError);
      });
    }

    order = await getCustomerOrderByCheckoutSession(user.id, session);
  }

  if (!order) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />
      <section className="ms-shell py-16">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mono text-xs uppercase tracking-[0.28em] text-[var(--ms-gradient-end)]">Order Confirmed</p>
          <h1 className="font-display mt-4 text-4xl font-black tracking-[-0.05em] md:text-5xl">
            Your order is in the queue
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[var(--ms-body)]">
            Stripe confirmed your payment and created one order with {order.itemCount} service{order.itemCount === 1 ? "" : "s"}.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-5xl rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)]">
          <div className="flex flex-col gap-4 border-b border-[var(--ms-border)] p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--ms-body)]">Order Reference</p>
              <p className="mt-2 break-all font-bold">{order.orderReference}</p>
              <p className="mono mt-2 break-all text-xs uppercase tracking-[0.14em] text-[var(--ms-body)]">Payment Reference: {order.transactionId}</p>
            </div>
            <div className="mono text-3xl font-black text-[var(--ms-price)]">{formatOrderMoney(order.total, order.currency)}</div>
          </div>

          <div className="divide-y divide-[var(--ms-border)]">
            {order.items.map((item) => {
              const options = Object.entries(item.selectedOptionsSnapshot ?? {});

              return (
                <article key={item.id} className="p-6">
                  <div className="grid gap-5 md:grid-cols-[88px_1fr_auto] md:items-start">
                    {item.service.image ? (
                      <img src={item.service.image} alt="" className="h-22 w-22 rounded-md object-cover" />
                    ) : (
                      <PlaceholderAsset alt={`${item.service.title} preview`} className="h-22 w-22 rounded-md" imageClassName="p-3" />
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-black">{item.service.title}</h2>
                        <span className="rounded-full border border-[var(--ms-border)] px-3 py-1 mono text-xs uppercase text-[var(--ms-success)]">
                          {order.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="mono mt-2 text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]">
                        {item.service.gameName} / {item.service.categoryName}
                      </p>
                      {options.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {options.map(([label, option]) => (
                            <span key={label} className="rounded-full border border-[var(--ms-border)] px-3 py-1 text-xs text-[var(--ms-body)]">
                              {label}: {formatOrderOptionValue(option.value)}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <p className="mono text-xl font-black text-[var(--ms-price)]">{formatOrderMoney(item.total, item.currency)}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href={`/profile/orders/${order.id}`} className="ms-button flex h-12 items-center px-6 mono text-xs uppercase tracking-[0.14em]">
            View Order Detail
          </Link>
          <Link href="/games" className="flex h-12 items-center rounded-md border border-[var(--ms-border)] px-6 mono text-xs uppercase tracking-[0.14em] text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-heading)]">
            Browse More Games
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
