import { NextResponse, type NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'
import { createAdminUser } from '@/lib/admin/admin-users'
import type { AdminRole } from '@/lib/admin/auth'

export async function POST(request: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  if (admin.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admins can create accounts.' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const display_name = typeof body?.display_name === 'string' ? body.display_name.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const role = body?.role as AdminRole

  if (!display_name || !email || !password || !role) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  if (!['super_admin', 'admin', 'support'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
  }

  try {
    const created = await createAdminUser({ display_name, email, password, role })
    return NextResponse.json({
      admin: {
        id: created.id,
        display_name: created.display_name,
        email: created.email,
        role: created.role,
      },
    }, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create admin account.'
    return NextResponse.json({ error: message }, { status: 409 })
  }
}
