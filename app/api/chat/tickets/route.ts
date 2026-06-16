import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getOrCreateAnonymousTicket, getOrCreateCustomerTicket, listAnonymousTickets, listCustomerTickets } from '@/lib/chat'

export async function GET() {
  const user = await getCurrentUser()

  try {
    const tickets = user ? await listCustomerTickets(user) : await listAnonymousTickets()
    return NextResponse.json({ tickets })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load tickets.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  const body = await request.json().catch(() => null)
  const orderRef = typeof body?.orderRef === 'string' && body.orderRef.trim() ? body.orderRef.trim() : null

  try {
    const ticket = user ? await getOrCreateCustomerTicket(user, orderRef) : await getOrCreateAnonymousTicket()
    return NextResponse.json({ ticket })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create ticket.' }, { status: 500 })
  }
}
