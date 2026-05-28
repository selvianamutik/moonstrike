import React from "react";
import { notFound } from "next/navigation";
import { getAdminOrderById } from "@/lib/admin-mock";
import { OrderDetailView } from "./OrderDetailView";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = getAdminOrderById(id);
  if (!order) notFound();
  return <OrderDetailView order={order} />;
}
