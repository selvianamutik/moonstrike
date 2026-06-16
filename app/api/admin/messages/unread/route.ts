import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'
import { getAdminUnreadTicketCount } from '@/lib/chat'

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  try {
    const unreadTicketCount = await getAdminUnreadTicketCount()
    return NextResponse.json({ unreadTicketCount })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load unread messages.' }, { status: 500 })
  }
}
