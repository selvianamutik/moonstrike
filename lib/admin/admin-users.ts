import { createAdminClient } from '@/lib/supabase/admin'
import { hashAdminPassword, type AdminRole } from '@/lib/admin/auth'

export type AdminUserRecord = {
  id: string
  display_name: string
  email: string
  role: AdminRole
  status: string
  created_at: string
  last_sign_in_at: string | null
}

export async function listAdminUsers() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('admin_users')
    .select('id, display_name, email, role, status, created_at, last_login')
    .order('created_at', { ascending: true })
    .returns<(Omit<AdminUserRecord, 'last_sign_in_at'> & { last_login: string | null })[]>()

  if (error && error.code === '42703') {
    const { data: fallback, error: fallbackError } = await supabase
      .from('admin_users')
      .select('id, display_name, email, status, created_at, last_login')
      .order('created_at', { ascending: true })
      .returns<(Omit<AdminUserRecord, 'last_sign_in_at' | 'role'> & { last_login: string | null })[]>()

    if (fallbackError) throw fallbackError
    return (fallback ?? []).map((u) => ({ ...u, role: 'admin' as AdminRole, last_sign_in_at: u.last_login }))
  }

  if (error) throw error
  return (data ?? []).map((u) => ({ ...u, last_sign_in_at: u.last_login }))
}

export async function updateAdminUserRole(id: string, role: AdminRole) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('admin_users')
    .update({ role })
    .eq('id', id)

  if (error) throw error
  return { ok: true }
}

export async function deleteAdminUser(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('admin_users')
    .delete()
    .eq('id', id)

  if (error) throw error
  return { ok: true }
}

export type RolePermission = {
  role: AdminRole
  description: string
  permissions: string[]
  updated_at: string
}

export async function createAdminUser(data: {
  display_name: string
  email: string
  password: string
  role: AdminRole
}) {
  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', data.email.toLowerCase().trim())
    .maybeSingle()

  if (existing) {
    throw new Error('An admin with this email already exists.')
  }

  const password_hash = hashAdminPassword(data.password)

  const { data: admin, error } = await supabase
    .from('admin_users')
    .insert({
      display_name: data.display_name.trim(),
      email: data.email.toLowerCase().trim(),
      password_hash,
      role: data.role,
      status: 'active',
      avatar: '',
    })
    .select('id, display_name, email, role, status, created_at')
    .single()

  if (error) throw error
  return admin
}

export async function getRolePermissions() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('role_permissions')
    .select('*')
    .order('role', { ascending: true })
    .returns<RolePermission[]>()

  if (error && error.code === '42P01') {
    return [] as RolePermission[]
  }

  if (error) throw error
  return data ?? []
}

export async function updateRolePermission(
  role: AdminRole,
  data: { description: string; permissions: string[] }
) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('role_permissions')
    .upsert({
      role,
      description: data.description,
      permissions: data.permissions,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return { ok: true }
}
