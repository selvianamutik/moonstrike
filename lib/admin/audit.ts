import type { NextRequest } from 'next/server'
import type { AdminSession } from '@/lib/admin/session'
import { createAdminClient } from '@/lib/supabase/admin'

type AuditStatus = 'success' | 'critical' | 'blocked'

function getClientIp(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    ''

  return ip === 'unknown' || ip.length === 0 ? null : ip
}

export async function writeAuditLog({
  action,
  status,
  request,
  admin,
  actorLabel,
}: {
  action: string
  status: AuditStatus
  request?: NextRequest
  admin?: AdminSession | null
  actorLabel?: string
}) {
  const supabase = createAdminClient()

  const { error } = await supabase.from('audit_logs').insert({
    actor_id: admin?.id ?? null,
    actor_type: admin ? 'admin' : 'system',
    actor_label: admin?.displayName ?? actorLabel ?? 'System',
    action,
    ip_address: request ? getClientIp(request) : null,
    status,
  })

  if (error) {
    console.error('Failed to write audit log', error.message)
  }
}
