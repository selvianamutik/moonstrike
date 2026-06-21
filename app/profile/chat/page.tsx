import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requireVerifiedUser } from "@/lib/auth/session";
import { formatMemberSince, getUserDisplayName, getUserInitials } from "@/lib/auth/user-display";
import { formatOrderMoney, listCustomerOrders, type CustomerOrder } from "@/lib/orders";
import { listCustomerTickets, listMessages } from "@/lib/chat";
import { ProfileChatClient } from "./ProfileChatClient";

export const dynamic = "force-dynamic";

function formatTotalSpent(orders: CustomerOrder[]) {
  const totals = orders.reduce(
    (sum, order) => {
      sum[order.currency] += order.total;
      return sum;
    },
    { USD: 0, EUR: 0 },
  );

  const parts = [];
  if (totals.USD > 0) parts.push(formatOrderMoney(totals.USD, "USD"));
  if (totals.EUR > 0) parts.push(formatOrderMoney(totals.EUR, "EUR"));
  return parts.length > 0 ? parts.join(" / ") : "$0.00";
}

export default async function ProfileChatPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const user = await requireVerifiedUser("/profile/chat");
  const resolvedSearchParams = await searchParams;
  const orderRef = typeof resolvedSearchParams.order === "string" ? resolvedSearchParams.order : null;
  const orders = await listCustomerOrders(user.id);
  const tickets = await listCustomerTickets(user);
  const orderTicket = orderRef ? tickets.find((ticket) => ticket.orderRef === orderRef) ?? null : null;
  const activeTicket = orderTicket;
  const initialMessagePage = activeTicket ? await listMessages(activeTicket.id) : { messages: [], hasMore: false };
  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(displayName, user.email);
  const memberSince = formatMemberSince(user.created_at);

  return (
    <main className="min-h-screen bg-[var(--ms-bg-page)] text-[var(--ms-heading)]">
      <SiteHeader />
      <section className="mx-auto grid w-[min(1520px,calc(100%_-_48px))] gap-8 py-12 lg:grid-cols-[270px_minmax(0,1fr)]">
        <ProfileSidebar
          displayName={displayName}
          email={user.email}
          initials={initials}
          memberSince={memberSince}
          totalOrders={orders.length}
          totalSpent={formatTotalSpent(orders)}
        />

        <div>
          <div className="border-b border-[var(--ms-border)] pb-7">
            <p className="mono text-xs uppercase tracking-[0.28em] text-[var(--ms-gradient-end)]">Customer Dashboard</p>
            <h1 className="font-display mt-3 text-4xl font-black tracking-[-0.05em]">Chat</h1>
          </div>

          <ProfileChatClient
            key={activeTicket?.id ?? (orderRef ? `draft:${orderRef}` : "empty")}
            initialTickets={tickets}
            chatOrders={orders.map((order) => ({ orderRef: order.orderReference, label: `${order.orderReference} / ${order.serviceSummary}` }))}
            initialMessages={initialMessagePage.messages}
            initialHasMore={initialMessagePage.hasMore}
            initialSelectedId={activeTicket?.id ?? ""}
            initialDraftOrderRef={orderRef && !orderTicket ? orderRef : null}
          />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
