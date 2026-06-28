import { NextResponse, type NextRequest } from 'next/server'
import { writeAuditLog } from '@/lib/admin/audit'
import { getAdminSession } from '@/lib/admin/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const STATUSES = new Set(['active', 'draft', 'archived'])

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const slug = slugify(typeof body?.slug === 'string' ? body.slug : name)
  const genreId = typeof body?.genreId === 'string' ? body.genreId.trim() : ''
  const platform = typeof body?.platform === 'string' ? body.platform.trim() : 'Cross-play'
  const description =
    typeof body?.description === 'string' ? body.description.trim() : ''
  const image = typeof body?.image === 'string' ? body.image.trim() : ''
  const heroImage = typeof body?.heroImage === 'string' ? body.heroImage.trim() : ''
  const status =
    typeof body?.status === 'string' && STATUSES.has(body.status)
      ? body.status
      : 'draft'

  if (!name || !slug || !genreId) {
    return NextResponse.json(
      { error: 'Name, slug, and genre are required.' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('games')
    .insert({
      name,
      slug,
      image,
      hero_image: heroImage,
      genre_id: genreId,
      platforms: [platform],
      description,
      status,
      updated_at: new Date().toISOString(),
    })
    .select('id, slug')
    .single<{ id: string; slug: string }>()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await writeAuditLog({
    action: `Created game: ${name}`,
    status: 'success',
    request,
    admin,
  })

  revalidatePath('/')
  revalidatePath('/games')
  revalidatePath(`/${data.slug}`)
  revalidatePath('/admin/games')

  return NextResponse.json({ game: data })
}
