import { NextResponse } from 'next/server'
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

export async function POST() {
  const user = await getCurrentUser()

  try {
    const ticket = user ? await getOrCreateCustomerTicket(user) : await getOrCreateAnonymousTicket()
    return NextResponse.json({ ticket })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create ticket.' }, { status: 500 })
  }
}
