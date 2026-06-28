import { revalidatePath } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'
import { writeAuditLog } from '@/lib/admin/audit'
import { getAdminSession } from '@/lib/admin/session'
import {
  normalizeLandingBenefitsData,
  normalizeLandingStepsData,
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
  const scheduledAt =
    typeof body?.scheduledAt === 'string' && body.scheduledAt.trim()
      ? body.scheduledAt.trim()
      : null
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

  if (block.type !== 'benefits_section' && block.type !== 'steps_section') {
    return NextResponse.json(
      { error: 'Only landing benefits and How It Works sections are editable here. Use hero banners for landing hero content.' },
      { status: 400 }
    )
  }

  if (status === 'scheduled' && !scheduledAt) {
    return NextResponse.json({ error: 'Scheduled content needs a start date.' }, { status: 400 })
  }

  if (block.type === 'benefits_section' && status === 'active') {
    const { count, error: activeBenefitsError } = await supabase
      .from('content_blocks')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'benefits_section')
      .eq('status', 'active')
      .neq('id', id)

    if (activeBenefitsError) {
      return NextResponse.json({ error: activeBenefitsError.message }, { status: 500 })
    }

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: 'Only one active Benefits section is allowed. Draft the existing active Benefits content before activating another one.' },
        { status: 400 }
      )
    }
  }

  const blockName = block.type === 'benefits_section' ? 'Why Choose Us' : 'How It Works'
  const blockData = block.type === 'benefits_section'
    ? normalizeLandingBenefitsData(body?.data)
    : normalizeLandingStepsData(body?.data)
  const thumbnail =
    'thumbnailUrl' in blockData && typeof blockData.thumbnailUrl === 'string' && blockData.thumbnailUrl.length > 0
      ? blockData.thumbnailUrl
      : null

  const { error } = await supabase
    .from('content_blocks')
    .update({
      name: blockName,
      status,
      data: blockData,
      thumbnail,
      scheduled_at: status === 'scheduled' ? scheduledAt : null,
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { id } = await params
  const supabase = createAdminClient()

  const { data: block, error: lookupError } = await supabase
    .from("content_blocks")
    .select("id, name, type, data")
    .eq("id", id)
    .maybeSingle<{ id: string; name: string; type: string; data: unknown }>()

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 })
  }

  if (!block) {
    return NextResponse.json({ error: "Content block not found." }, { status: 404 })
  }

  if (block.type !== "benefits_section" && block.type !== "steps_section") {
    return NextResponse.json({ error: "Only benefits and How It Works sections can be deleted here." }, { status: 400 })
  }

  const { error } = await supabase.from("content_blocks").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await writeAuditLog({
    action: `Deleted CMS content block: ${block.name}`,
    status: "success",
    eventType: "cms",
  })

  revalidatePath("/")
  revalidatePath("/admin/content")

  return NextResponse.json({ ok: true })
}
