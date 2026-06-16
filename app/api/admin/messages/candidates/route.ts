import { NextResponse, type NextRequest } from "next/server";
import { getUserDisplayName } from "@/lib/auth/user-display";
import { getAdminSession } from "@/lib/admin/session";
import { listAdminOrders } from "@/lib/admin/orders";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const type = request.nextUrl.searchParams.get("type");
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();

  try {
    if (type === "order") {
      const orders = await listAdminOrders();
      const items = orders
        .filter((order) => {
          if (!query) return true;
          return (
            order.orderReference.toLowerCase().includes(query) ||
            order.customerEmail.toLowerCase().includes(query) ||
            order.customerName.toLowerCase().includes(query) ||
            order.serviceName.toLowerCase().includes(query)
          );
        })
        .slice(0, 50)
        .map((order) => ({
          type: "order" as const,
          value: order.orderReference,
          label: order.orderReference,
          detail: `${order.customerName} / ${order.customerEmail}`,
          meta: `${order.itemCount} item${order.itemCount === 1 ? "" : "s"} / ${order.status}`,
        }));

      return NextResponse.json({ items });
    }

    if (type === "support") {
      const supabase = createAdminClient();
      const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) throw error;

      const items = (data.users ?? [])
        .map((user) => {
          const name = getUserDisplayName(user);
          const email = user.email ?? "";
          return {
            type: "support" as const,
            value: email,
            label: name,
            detail: email,
            meta: user.email_confirmed_at ? "Verified" : "Unverified",
          };
        })
        .filter((user) => user.value)
        .filter((user) => {
          if (!query) return true;
          return user.label.toLowerCase().includes(query) || user.detail.toLowerCase().includes(query);
        })
        .sort((left, right) => left.detail.localeCompare(right.detail))
        .slice(0, 50);

      return NextResponse.json({ items });
    }

    return NextResponse.json({ error: "Invalid candidate type." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load candidates." }, { status: 500 });
  }
}
