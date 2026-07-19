import { NextResponse, type NextRequest } from 'next/server'
import { writeAuditLog } from '@/lib/admin/audit'
import { getAdminSession } from '@/lib/admin/session'
import { CMS_MEDIA_BUCKET, getStoragePathFromPublicUrl } from '@/lib/cms/storage'
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
  const { data: existing, error: lookupError } = await supabase
    .from('games')
    .select('slug, image, hero_image')
    .eq('id', id)
    .maybeSingle<{ slug: string; image: string; hero_image: string }>()

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 })
  }

  const { error } = await supabase
    .from('games')
    .update({
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
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const replacedPaths = [existing?.image, existing?.hero_image]
    .filter((value): value is string => Boolean(value))
    .filter((value) => value !== image && value !== heroImage)
    .map((value) => getStoragePathFromPublicUrl(value))
    .filter((value): value is string => Boolean(value))

  if (replacedPaths.length > 0) {
    const { error: removeError } = await supabase.storage
      .from(CMS_MEDIA_BUCKET)
      .remove(Array.from(new Set(replacedPaths)))

    if (removeError) {
      console.error('Failed to remove replaced game image', removeError.message)
    }
  }

  await writeAuditLog({
    action: `Updated game: ${name}`,
    status: 'success',
    request,
    admin,
  })

  revalidatePath('/')
  revalidatePath('/games')
  if (existing?.slug) revalidatePath(`/${existing.slug}`)
  revalidatePath(`/${slug}`)
  revalidatePath('/admin/games')

  return NextResponse.json({ ok: true })
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
  const supabase = createAdminClient()
  const { data: existing, error: lookupError } = await supabase
    .from('games')
    .select('name, slug, image, hero_image')
    .eq('id', id)
    .maybeSingle<{ name: string; slug: string; image: string; hero_image: string }>()

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 })
  }

  if (!existing) {
    return NextResponse.json({ error: 'Game not found.' }, { status: 404 })
  }

  const { error } = await supabase.from('games').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const imagePaths = [existing.image, existing.hero_image]
    .map((value) => (value ? getStoragePathFromPublicUrl(value) : null))
    .filter((value): value is string => Boolean(value))

  if (imagePaths.length > 0) {
    const { error: removeError } = await supabase.storage
      .from(CMS_MEDIA_BUCKET)
      .remove(Array.from(new Set(imagePaths)))

    if (removeError) {
      console.error('Failed to remove deleted game image', removeError.message)
    }
  }

  await writeAuditLog({
    action: `Deleted game: ${existing.name}`,
    status: 'success',
    request,
    admin,
  })

  revalidatePath('/')
  revalidatePath('/games')
  revalidatePath(`/${existing.slug}`)
  revalidatePath('/admin/games')

  return NextResponse.json({ ok: true })
}
