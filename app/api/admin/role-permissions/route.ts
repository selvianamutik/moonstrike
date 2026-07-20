import { NextResponse, type NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'
import { getRolePermissions, updateRolePermission } from '@/lib/admin/admin-users'
import type { AdminRole } from '@/lib/admin/auth'

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const permissions = await getRolePermissions()
  return NextResponse.json({ permissions })
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  if (admin.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admins can edit role permissions.' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const role = body?.role as AdminRole
  const description = typeof body?.description === 'string' ? body.description.trim() : ''
  const permissions = Array.isArray(body?.permissions) ? body.permissions.filter((p: unknown) => typeof p === 'string') : []

  if (!role || !['super_admin', 'admin', 'support'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
  }

  if (!description) {
    return NextResponse.json({ error: 'Description is required.' }, { status: 400 })
  }

  try {
    await updateRolePermission(role, { description, permissions })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to update role permissions.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
