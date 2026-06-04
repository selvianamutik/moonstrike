import { listAdminOrders } from "@/lib/admin/orders";
import { OrdersPageClient } from "./OrdersPageClient";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orders = await listAdminOrders();

  return <OrdersPageClient orders={orders} />;
}
