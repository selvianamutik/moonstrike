import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getCustomerUnreadSummary } from '@/lib/chat'

export async function GET() {
  const user = await getCurrentUser()

  try {
    const unreadSummary = await getCustomerUnreadSummary(user)
    return NextResponse.json(unreadSummary)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load unread messages.' }, { status: 500 })
  }
}
