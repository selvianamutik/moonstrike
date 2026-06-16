import { NextResponse, type NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'
import { getOrCreateOrderTicketForAdmin, getOrCreateSupportTicketForAdmin, listAdminTickets } from '@/lib/chat'

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  try {
    const tickets = await listAdminTickets()
    return NextResponse.json({ tickets })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load tickets.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const orderRef = typeof body?.orderRef === 'string' && body.orderRef.trim() ? body.orderRef.trim() : null
  const customerEmail = typeof body?.customerEmail === 'string' && body.customerEmail.trim() ? body.customerEmail.trim() : null
  if (!orderRef && !customerEmail) return NextResponse.json({ error: 'Order reference or customer email is required.' }, { status: 400 })

  try {
    const ticket = orderRef ? await getOrCreateOrderTicketForAdmin(orderRef) : await getOrCreateSupportTicketForAdmin(customerEmail!)
    return NextResponse.json({ ticket })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create chat.' }, { status: 500 })
  }
}
