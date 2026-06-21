import { LivePageRefresh } from "@/components/live-page-refresh";
import { listAdminOrders } from "@/lib/admin/orders";
import { OrdersPageClient } from "./OrdersPageClient";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orders = await listAdminOrders();

  return (
    <>
      <LivePageRefresh intervalMs={10_000} />
      <OrdersPageClient orders={orders} />
    </>
  );
}
