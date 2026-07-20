import { NextResponse, type NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'
import { deleteAdminUser, updateAdminUserRole } from '@/lib/admin/admin-users'
import type { AdminRole } from '@/lib/admin/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  if (admin.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admins can manage roles.' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  const role = body?.role as AdminRole

  if (!role || !['super_admin', 'admin', 'support'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
  }

  try {
    await updateAdminUserRole(id, role)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed to update role.' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  if (admin.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admins can delete accounts.' }, { status: 403 })
  }

  const { id } = await params
  if (id === admin.id) {
    return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 })
  }

  try {
    await deleteAdminUser(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed to delete.' }, { status: 500 })
  }
}
