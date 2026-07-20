import { NextResponse, type NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'
import { createCustomPage, listCustomPages } from '@/lib/admin/custom-pages'
import { revalidatePath } from 'next/cache'

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const pages = await listCustomPages()
  return NextResponse.json({ pages })
}

export async function POST(request: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body.' }, { status: 400 })

  const category = String(body.category ?? 'page')

  const result = await createCustomPage({
    title: String(body.title ?? ''),
    slug: String(body.slug ?? ''),
    content: String(body.content ?? ''),
    metaDescription: String(body.metaDescription ?? ''),
    image: String(body.image ?? ''),
    category,
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
