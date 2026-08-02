import { NextResponse, type NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'
import { listCustomerOrders } from '@/lib/orders'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { userId } = await params
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? '10')

  try {
    const orders = await listCustomerOrders(userId)
    return NextResponse.json({ orders: orders.slice(0, limit) })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load orders.' },
      { status: 500 }
    )
  }
}
