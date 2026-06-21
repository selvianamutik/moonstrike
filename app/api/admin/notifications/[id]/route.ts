import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/session";
import { deleteNotification } from "@/lib/notifications";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;

  try {
    await deleteNotification("admin", admin.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete notification." }, { status: 500 });
  }
}
