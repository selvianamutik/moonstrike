import { revalidatePath } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'
import { writeAuditLog } from '@/lib/admin/audit'
import { getAdminSession } from '@/lib/admin/session'
import {
  normalizeLandingBenefitsData,
  normalizeLandingHeroData,
} from '@/lib/cms/landing'
import { CMS_MEDIA_BUCKET, getChangedStoragePaths } from '@/lib/cms/storage'
import { createAdminClient } from '@/lib/supabase/admin'

const CMS_STATUSES = new Set(['active', 'scheduled', 'draft'])

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
  const status =
    typeof body?.status === 'string' && CMS_STATUSES.has(body.status)
      ? body.status
      : 'draft'
  const supabase = createAdminClient()

  const { data: block, error: lookupError } = await supabase
    .from('content_blocks')
    .select('id, type, data')
    .eq('id', id)
    .maybeSingle<{ id: string; type: string; data: unknown }>()

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 })
  }

  if (!block) {
    return NextResponse.json({ error: 'Content block not found.' }, { status: 404 })
  }

  if (block.type !== 'hero' && block.type !== 'benefits_section') {
    return NextResponse.json(
      { error: 'Only landing hero and benefits editing are wired right now.' },
      { status: 400 }
    )
  }

  const blockName = block.type === 'hero' ? 'Landing Hero' : 'Why Choose Us'
  const blockData =
    block.type === 'hero'
      ? normalizeLandingHeroData(body?.data)
      : normalizeLandingBenefitsData(body?.data)
  const thumbnail =
    typeof blockData.thumbnailUrl === 'string' && blockData.thumbnailUrl.length > 0
      ? blockData.thumbnailUrl
      : null

  const { error } = await supabase
    .from('content_blocks')
    .update({
      name: blockName,
      status,
      data: blockData,
      thumbnail,
      modified_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const stalePaths = getChangedStoragePaths(block.data, blockData)
  if (stalePaths.length > 0) {
    const { error: removeError } = await supabase.storage
      .from(CMS_MEDIA_BUCKET)
      .remove(stalePaths)

    if (removeError) {
      console.error('Failed to remove replaced CMS images', removeError.message)
    }
  }

  await writeAuditLog({
    action: `Updated CMS content block: ${blockName} (${status})`,
    status: 'success',
    request,
    admin,
  })

  revalidatePath('/')
  revalidatePath('/admin/content')
  revalidatePath(`/admin/content/${id}/edit`)

  return NextResponse.json({ ok: true })
}
