import { NextResponse, type NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'
import { deleteGenre } from '@/lib/cms/genres'
import { revalidatePath } from 'next/cache'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { id } = await params
  const result = await deleteGenre({ id, request, admin })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  revalidatePath('/admin/games')
  revalidatePath('/games')
  revalidatePath('/')

  return NextResponse.json({ ok: true })
}
