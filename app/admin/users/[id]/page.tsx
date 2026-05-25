import React from "react";
import { notFound } from "next/navigation";
import { getAdminUserById } from "@/lib/admin-mock";
import { UserDetailView } from "./UserDetailView";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = getAdminUserById(id);
  if (!user) notFound();
  return <UserDetailView user={user} />;
}
