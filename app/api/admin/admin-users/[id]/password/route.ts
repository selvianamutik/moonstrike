import { NextResponse, type NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'
import { updateAdminPassword } from '@/lib/admin/admin-users'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  if (admin.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admins can change passwords.' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  const newPassword = body?.password

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  try {
    await updateAdminPassword(id, newPassword)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed to update password.' }, { status: 500 })
  }
}
