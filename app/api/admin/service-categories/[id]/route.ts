import { NextResponse, type NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'
import { deleteServiceCategory, updateServiceCategory } from '@/lib/cms/service-categories'
import { revalidatePath } from 'next/cache'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  const gameId = typeof body?.gameId === 'string' ? body.gameId : ''
  const name = typeof body?.name === 'string' ? body.name : ''
  const slug = typeof body?.slug === 'string' ? body.slug : undefined
  const sortOrder = Number(body?.sortOrder)
  const result = await updateServiceCategory({
    id,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { id } = await params
  const result = await deleteServiceCategory({ id, request, admin })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  revalidatePath('/admin/services')
  revalidatePath('/')
  revalidatePath('/games')

  return NextResponse.json({ ok: true })
}
