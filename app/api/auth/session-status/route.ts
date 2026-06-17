import { NextResponse } from "next/server";
import { getUserBanState } from "@/lib/auth/ban";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ authenticated: false, banned: false });
  }

  const banState = await getUserBanState(user.id);

  if (banState.banned) {
    await supabase.auth.signOut();
    return NextResponse.json({
      authenticated: false,
      banned: true,
      bannedUntil: banState.bannedUntil,
    });
  }

  return NextResponse.json({ authenticated: true, banned: false });
}
