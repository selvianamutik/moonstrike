import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { markCustomerTicketRead } from '@/lib/chat'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser()
  const { id } = await params

  try {
    const marked = await markCustomerTicketRead(id, user?.id ?? null)
    if (!marked) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to mark ticket read.' }, { status: 500 })
  }
}
