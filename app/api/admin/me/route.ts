import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'

export async function GET() {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ admin: null }, { status: 401 })
  }

  return NextResponse.json({
    admin: {
      id: admin.id,
      email: admin.email,
      displayName: admin.displayName,
    },
  })
}
