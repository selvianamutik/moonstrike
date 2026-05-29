import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_SESSION_COOKIE } from '@/lib/admin/auth'
import { writeAuditLog } from '@/lib/admin/audit'
import { getAdminSession } from '@/lib/admin/session'

export async function POST(request: NextRequest) {
  const admin = await getAdminSession()
  const cookieStore = await cookies()

  cookieStore.delete(ADMIN_SESSION_COOKIE)

  if (admin) {
    await writeAuditLog({
      action: 'Admin logout successful',
      status: 'success',
      request,
      admin,
    })
  }

  return NextResponse.json({ ok: true })
}
