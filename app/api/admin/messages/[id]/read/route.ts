import { NextResponse, type NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'
import { markAdminTicketRead } from '@/lib/chat'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { id } = await params

  try {
    const marked = await markAdminTicketRead(id)
    if (!marked) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to mark ticket read.' }, { status: 500 })
  }
}
