import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifyAdminToken } from '@/lib/admin/auth'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  const admin = token ? verifyAdminToken(token) : null

  if (!admin) {
    return NextResponse.json({ admin: null }, { status: 401 })
  }

  return NextResponse.json({
    admin: {
      id: admin.sub,
      email: admin.email,
      displayName: admin.name,
    },
  })
}
