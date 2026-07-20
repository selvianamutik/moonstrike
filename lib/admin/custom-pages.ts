import { writeAuditLog } from '@/lib/admin/audit'
import type { AdminSession } from '@/lib/admin/session'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NextRequest } from 'next/server'

export type CustomPageRow = {
  id: string
  title: string
  slug: string
  content: string
  meta_description: string
  image: string
  category: 'page' | 'blog' | 'guide'
  status: 'draft' | 'active'
  created_by: string
  created_at: string
  updated_at: string
}

export function getCategoryPrefix(category: string) {
  if (category === 'blog') return '/blog'
  if (category === 'guide') return '/guide'
  return ''
}

export function getPageRoutePrefix(category: string) {
  if (category === 'blog') return '/blog'
  if (category === 'guide') return '/guide'
  return '/p'
}

export function getPageUrl(page: { slug: string; category: string }) {
  const prefix = getCategoryPrefix(page.category)
  return `${prefix}/${page.slug}`
}

export async function listCustomPages() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('custom_pages')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<CustomPageRow[]>()

  if (error) throw error
  return data ?? []
}

export async function listCustomPagesByCategory(category: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('custom_pages')
    .select('*')
    .eq('category', category)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .returns<CustomPageRow[]>()

  if (error) throw error
  return data ?? []
}

export async function getCustomPage(id: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('custom_pages')
    .select('*')
    .eq('id', id)
    .maybeSingle<CustomPageRow>()

  if (error) throw error
  return data ?? null
}

export async function getCustomPageBySlug(slug: string, category?: string) {
  const supabase = createAdminClient()
  let query = supabase
    .from('custom_pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query.maybeSingle<CustomPageRow>()

  if (error) throw error
  return data ?? null
}

export async function createCustomPage({
  title,
  slug,
  content,
  metaDescription,
  image,
  category,
  request,
  admin,
}: {
  title: string
  slug: string
  content: string
  metaDescription: string
  image?: string
  category?: string
  request: NextRequest
  admin: AdminSession
}) {
  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('custom_pages')
    .select('id')
    .eq('slug', slug)
    .maybeSingle<{ id: string }>()

  if (existing) {
    return { error: 'A page with this slug already exists.', status: 409 as const }
  }

  const { data, error } = await supabase
    .from('custom_pages')
    .insert({
      title,
      slug,
      content,
      meta_description: metaDescription,
      image: image ?? '',
      category: category ?? 'page',
      created_by: admin.id,
    })
    .select()
    .single<CustomPageRow>()

  if (error) return { error: error.message, status: 500 as const }

  await writeAuditLog({
    action: `Created custom page: ${title}`,
    status: 'success',
    request,
    admin,
  })

  return { page: data }
}

export async function updateCustomPage({
  id,
  title,
  slug,
  content,
  metaDescription,
  image,
  category,
  status,
  request,
  admin,
}: {
  id: string
  title: string
  slug: string
  content: string
  metaDescription: string
  image?: string
  category?: string
  status: string
  request: NextRequest
  admin: AdminSession
}) {
  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('custom_pages')
    .select('id')
    .eq('slug', slug)
    .neq('id', id)
    .maybeSingle<{ id: string }>()

  if (existing) {
    return { error: 'A page with this slug already exists.', status: 409 as const }
  }

  const { data, error } = await supabase
    .from('custom_pages')
    .update({
      title,
      slug,
      content,
      meta_description: metaDescription,
      image: image ?? '',
      category: category ?? 'page',
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single<CustomPageRow>()

  if (error) return { error: error.message, status: 500 as const }

  await writeAuditLog({
    action: `Updated custom page: ${title}`,
    status: 'success',
    request,
    admin,
  })

  return { page: data }
}

export async function deleteCustomPage({
  id,
  request,
  admin,
}: {
  id: string
  request: NextRequest
  admin: AdminSession
}) {
  const supabase = createAdminClient()

  const { data: page, error: lookupError } = await supabase
    .from('custom_pages')
    .select('id, title')
    .eq('id', id)
    .maybeSingle<{ id: string; title: string }>()

  if (lookupError) return { error: lookupError.message, status: 500 as const }
  if (!page) return { error: 'Page not found.', status: 404 as const }

  const { error } = await supabase.from('custom_pages').delete().eq('id', id)
  if (error) return { error: error.message, status: 500 as const }

  await writeAuditLog({
    action: `Deleted custom page: ${page.title}`,
    status: 'success',
    request,
    admin,
  })

  return { ok: true as const }
}
