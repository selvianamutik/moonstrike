import { NextResponse, type NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'
import { createGenre, ensureDefaultGenres } from '@/lib/cms/genres'
import { revalidatePath } from 'next/cache'

export async function GET() {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const genres = await ensureDefaultGenres()

  return NextResponse.json({ genres })
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name : ''
  const slug = typeof body?.slug === 'string' ? body.slug : undefined
  const result = await createGenre({ name, slug, request, admin })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  revalidatePath('/admin/games')
  revalidatePath('/games')
  revalidatePath('/')

  return NextResponse.json({ genre: result.genre })
}
