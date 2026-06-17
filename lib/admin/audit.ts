import type { AdminSession } from '@/lib/admin/session'
import { createAdminClient } from '@/lib/supabase/admin'

type AuditStatus = 'success' | 'critical' | 'blocked'
export type AuditEventType =
  | 'auth'
  | 'admin_action'
  | 'checkout'
  | 'payment_webhook'
  | 'refund'
  | 'order_lifecycle'
  | 'cms'
  | 'settings'
  | 'cron'
  | 'security'

function getClientIp(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    ''

  return ip === 'unknown' || ip.length === 0 ? null : ip
}

function inferAuditEventType(action: string, status: AuditStatus): AuditEventType {
  const normalized = action.toLowerCase()

  if (normalized.includes('checkout')) return 'checkout'
  if (normalized.includes('webhook')) return 'payment_webhook'
  if (normalized.includes('refund')) return 'refund'
  if (normalized.includes('auto-complete') || normalized.includes('cron')) return 'cron'
  if (normalized.includes('settings') || normalized.includes('password') || normalized.includes('avatar')) return 'settings'
  if (normalized.includes('login') || normalized.includes('logout') || normalized.includes('rate limit')) return 'auth'
  if (
    normalized.includes('game') ||
    normalized.includes('service') ||
    normalized.includes('content') ||
    normalized.includes('genre') ||
    normalized.includes('category') ||
    normalized.includes('cms') ||
    normalized.includes('upload')
  ) {
    return 'cms'
  }
  if (normalized.includes('order') || normalized.includes('completion') || normalized.includes('delivered')) return 'order_lifecycle'
  if (status === 'blocked' || status === 'critical') return 'security'

  return 'admin_action'
}

export async function writeAuditLog({
  action,
  status,
  request,
  admin,
  actorLabel,
  eventType,
}: {
  action: string
  status: AuditStatus
  request?: Request
  admin?: AdminSession | null
  actorLabel?: string
  eventType?: AuditEventType
}) {
  const supabase = createAdminClient()

  const { error } = await supabase.from('audit_logs').insert({
    actor_id: admin?.id ?? null,
    actor_type: admin ? 'admin' : 'system',
    actor_label: admin?.displayName ?? actorLabel ?? 'System',
    event_type: eventType ?? inferAuditEventType(action, status),
    action,
    ip_address: request ? getClientIp(request) : null,
    status,
  })

  if (error) {
    console.error('Failed to write audit log', error.message)
  }
}
