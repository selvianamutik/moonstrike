import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getTicketForAnonymous, getTicketForCustomer, listMessages, sendChatMessage, type ChatAttachment } from '@/lib/chat'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser()

  const { id } = await params

  try {
    const ticket = user ? await getTicketForCustomer(id, user.id) : await getTicketForAnonymous(id)
    if (!ticket) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 })

    const limit = Number(request.nextUrl.searchParams.get('limit') ?? '10')
    const before = request.nextUrl.searchParams.get('before')
    const page = await listMessages(id, { limit, before })
    return NextResponse.json(page)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load messages.' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser()

  const { id } = await params
  const body = await request.json().catch(() => null)
  const content = typeof body?.content === 'string' ? body.content : ''
  const attachments = Array.isArray(body?.attachments) ? (body.attachments as ChatAttachment[]) : []

  try {
    const ticket = user ? await getTicketForCustomer(id, user.id) : await getTicketForAnonymous(id)
    if (!ticket) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 })

    const message = await sendChatMessage({
      ticketId: id,
      senderId: user?.id ?? `anon:${id}`,
      senderRole: 'customer',
      content,
      attachments,
    })

    return NextResponse.json({ message })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to send message.' }, { status: 500 })
  }
}
