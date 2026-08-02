import { NextResponse, type NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'
import { getOrCreateCustomerTicket, listAdminTickets } from '@/lib/chat'
import { createAdminClient } from '@/lib/supabase/admin'
import type { User } from '@supabase/supabase-js'

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
  const customerEmail = typeof body?.customerEmail === 'string' && body.customerEmail.trim() ? body.customerEmail.trim() : null
  if (!customerEmail) return NextResponse.json({ error: 'Customer email is required.' }, { status: 400 })

  try {
    // Find the user by email and get/create their ticket
    const supabase = createAdminClient()
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
    if (userError) throw userError

    const customerUser = users.find((u) => u.email?.toLowerCase() === customerEmail.toLowerCase()) as User | undefined
    if (!customerUser) return NextResponse.json({ error: 'Customer not found.' }, { status: 404 })

    const ticket = await getOrCreateCustomerTicket(customerUser)
    return NextResponse.json({ ticket })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create chat.' }, { status: 500 })
  }
}
