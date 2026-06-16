import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { mergeAnonymousChatTickets } from '@/lib/chat'

export async function POST() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  try {
    await mergeAnonymousChatTickets(user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to merge chat.' }, { status: 500 })
  }
}
