import { NextResponse, type NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'
import { deletePrivateOffer, getPrivateOffer, updatePrivateOffer } from '@/lib/admin/private-offers'
import { usdToEur } from '@/lib/currency/convert'
import { revalidatePath } from 'next/cache'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { id } = await params
  const offer = await getPrivateOffer(id)
  if (!offer) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  return NextResponse.json({ offer })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body.' }, { status: 400 })

  const priceUsd = Number(body.priceUsd) || 0
  const priceEur = await usdToEur(priceUsd)

  const result = await updatePrivateOffer({
    id,
    gameId: String(body.gameId ?? ''),
    quantity: Number(body.quantity) || 1,
    platform: String(body.platform ?? ''),
    category: String(body.category ?? 'boosting'),
    priceUsd,
    priceEur,
    discountPercent: Number(body.discountPercent) || 0,
    title: String(body.title ?? ''),
    additionalInfo: String(body.additionalInfo ?? ''),
    slug: String(body.slug ?? ''),
    request,
    admin,
  })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  revalidatePath('/admin/private-offers')
  return NextResponse.json({ offer: result.offer })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { id } = await params
  const result = await deletePrivateOffer({ id, request, admin })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  revalidatePath('/admin/private-offers')
  return NextResponse.json({ ok: true })
}
