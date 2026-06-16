import { NextResponse, type NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'
import { listMessages, sendChatMessage, type ChatAttachment } from '@/lib/chat'
import { createAdminClient } from '@/lib/supabase/admin'

async function adminCanAccessTicket(ticketId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('support_tickets')
    .select('id')
    .eq('id', ticketId)
    .maybeSingle<{ id: string }>()

  if (error) throw error
  return Boolean(data)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { id } = await params

  try {
    const exists = await adminCanAccessTicket(id)
    if (!exists) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 })

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
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  const content = typeof body?.content === 'string' ? body.content : ''
  const attachments = Array.isArray(body?.attachments) ? (body.attachments as ChatAttachment[]) : []

  try {
    const exists = await adminCanAccessTicket(id)
    if (!exists) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 })

    const message = await sendChatMessage({
      ticketId: id,
      senderId: admin.id,
      senderRole: 'admin',
      content,
      attachments,
    })

    return NextResponse.json({ message })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to send message.' }, { status: 500 })
  }
}
