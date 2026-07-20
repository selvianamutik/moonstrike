import { NextResponse, type NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'
import { deleteCustomPage, getCustomPage, updateCustomPage } from '@/lib/admin/custom-pages'
import { revalidatePath } from 'next/cache'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { id } = await params
  const page = await getCustomPage(id)
  if (!page) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  return NextResponse.json({ page })
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

  const category = String(body.category ?? 'page')

  const result = await updateCustomPage({
    id,
    title: String(body.title ?? ''),
    slug: String(body.slug ?? ''),
    content: String(body.content ?? ''),
    metaDescription: String(body.metaDescription ?? ''),
    image: String(body.image ?? ''),
    category,
    status: String(body.status ?? 'draft'),
    request,
    admin,
  })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  revalidatePath('/admin/pages')
  revalidatePath(`/p/${result.page.slug}`)
  if (category === 'blog') revalidatePath(`/blog/${result.page.slug}`)
  if (category === 'guide') revalidatePath(`/guide/${result.page.slug}`)
  return NextResponse.json({ page: result.page })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { id } = await params
  const result = await deleteCustomPage({ id, request, admin })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  revalidatePath('/admin/pages')
  return NextResponse.json({ ok: true })
}
