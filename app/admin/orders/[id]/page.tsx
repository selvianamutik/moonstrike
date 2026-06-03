import React from "react";
import { notFound } from "next/navigation";
import { getAdminOrder } from "@/lib/admin/orders";
import { OrderDetailView } from "./OrderDetailView";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();
  return <OrderDetailView order={order} />;
}
