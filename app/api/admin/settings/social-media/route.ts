import { NextResponse, type NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/admin/session'
import { createAdminClient } from '@/lib/supabase/admin'

type SocialMediaPlatform = {
  id: string
  platform: string
  url: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('social_media_settings')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const { platform, url, is_active } = body

  if (!platform) {
    return NextResponse.json({ error: 'Platform is required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('social_media_settings')
    .update({
      url: url || null,
      is_active: is_active !== undefined ? is_active : true,
      updated_at: new Date().toISOString(),
    })
    .eq('platform', platform)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
