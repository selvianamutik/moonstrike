import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'
import { getRolePermissions } from '@/lib/admin/admin-users'

export async function GET() {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ admin: null }, { status: 401 })
  }

  let permissions: string[] = []
  if (admin.role === 'super_admin') {
    permissions = [
      'dashboard',
      'users',
      'games',
      'services',
      'orders',
      'transactions',
      'content',
      'pages',
      'messages',
      'logs',
      'settings',
      'admins',
    ]
  } else {
    try {
      const rolePerms = await getRolePermissions()
      const found = rolePerms.find((rp) => rp.role === admin.role)
      permissions = found ? found.permissions : []
    } catch (e) {
      console.error('Failed to load permissions for admin', e)
    }
  }

  return NextResponse.json({
    admin: {
      id: admin.id,
      email: admin.email,
      displayName: admin.displayName,
      role: admin.role,
    },
    permissions,
  })
}
