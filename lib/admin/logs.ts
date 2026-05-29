import { createAdminClient } from '@/lib/supabase/admin'

export type AuditLogRow = {
  id: string
  timestamp: string
  actor_id: string | null
  actor_type: 'admin' | 'system'
  actor_label: string
  action: string
  ip_address: string | null
  status: 'success' | 'critical' | 'blocked'
}

export async function listAuditLogs(limit = 100) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('audit_logs')
    .select(
      'id, timestamp, actor_id, actor_type, actor_label, action, ip_address, status'
    )
    .order('timestamp', { ascending: false })
    .limit(limit)
    .returns<AuditLogRow[]>()

  if (error) throw error

  return data ?? []
}
