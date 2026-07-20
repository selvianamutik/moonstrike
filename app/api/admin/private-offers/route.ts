import { NextResponse, type NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'
import { createPrivateOffer, listPrivateOffers } from '@/lib/admin/private-offers'
import { usdToEur } from '@/lib/currency/convert'
import { revalidatePath } from 'next/cache'

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const offers = await listPrivateOffers()
  return NextResponse.json({ offers })
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body.' }, { status: 400 })

  const priceUsd = Number(body.priceUsd) || 0
  const priceEur = await usdToEur(priceUsd)

  const result = await createPrivateOffer({
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
