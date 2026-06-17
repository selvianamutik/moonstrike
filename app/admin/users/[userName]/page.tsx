import React from "react";
import { notFound } from "next/navigation";
import { getAdminCustomerById } from "@/lib/admin/users";
import { UserDetailView } from "./UserDetailView";

export const dynamic = "force-dynamic";

export default async function UserDetailPage({ params }: { params: Promise<{ userName: string }> }) {
  const { userName } = await params;
  const user = await getAdminCustomerById(userName);
  if (!user) notFound();
  return <UserDetailView user={user} />;
}
