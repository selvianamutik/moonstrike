import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type SocialMediaLink = {
  platform: string
  url: string
  display_order: number
}

export async function GET() {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('social_media_settings')
    .select('platform, url, display_order')
    .eq('is_active', true)
    .not('url', 'is', null)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Failed to fetch social media links:', error)
    return NextResponse.json([], { status: 200 })
  }

  return NextResponse.json(data || [])
}
