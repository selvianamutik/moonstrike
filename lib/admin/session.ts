import { cookies } from 'next/headers'
import { ADMIN_SESSION_COOKIE, verifyAdminToken } from '@/lib/admin/auth'

export type AdminSession = {
  id: string
  email: string
  displayName: string
}

export async function getAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  const payload = token ? verifyAdminToken(token) : null

  if (!payload) return null

  return {
    id: payload.sub,
    email: payload.email,
    displayName: payload.name,
  } satisfies AdminSession
}
