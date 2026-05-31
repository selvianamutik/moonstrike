import { NextResponse, type NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'
import {
  createServiceCategory,
  listServiceCategories,
} from '@/lib/cms/service-categories'
import { revalidatePath } from 'next/cache'

export async function GET() {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const categories = await listServiceCategories()

  return NextResponse.json({ categories })
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const gameId = typeof body?.gameId === 'string' ? body.gameId : ''
  const name = typeof body?.name === 'string' ? body.name : ''
  const slug = typeof body?.slug === 'string' ? body.slug : undefined
  const sortOrder = Number(body?.sortOrder)
  const result = await createServiceCategory({
    gameId,
    name,
    slug,
    sortOrder,
    request,
    admin,
  })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  revalidatePath('/admin/services')
  revalidatePath('/')
  revalidatePath('/games')

  return NextResponse.json({ category: result.category })
}
