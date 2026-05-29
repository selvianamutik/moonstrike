import crypto from 'crypto'

export const ADMIN_SESSION_COOKIE = 'ms_admin_session'
export const ADMIN_SESSION_SECONDS = 8 * 60 * 60
export const ADMIN_REMEMBER_SECONDS = 30 * 24 * 60 * 60

type AdminTokenPayload = {
  sub: string
  email: string
  name: string
  role: 'admin'
  iat: number
  exp: number
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET

  if (!secret || secret.length < 32) {
    throw new Error('Missing JWT_SECRET with at least 32 characters')
  }

  return secret
}

function base64Url(input: Buffer | string) {
  return Buffer.from(input)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

function sign(input: string) {
  return base64Url(
    crypto.createHmac('sha256', getJwtSecret()).update(input).digest()
  )
}

export function hashAdminPassword(password: string) {
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(password, salt, 64)
  return `scrypt$${base64Url(salt)}$${base64Url(hash)}`
}

export function verifyAdminPassword(password: string, storedHash: string) {
  const [algorithm, saltValue, hashValue] = storedHash.split('$')
  if (algorithm !== 'scrypt' || !saltValue || !hashValue) return false

  const salt = Buffer.from(saltValue, 'base64url')
  const expected = Buffer.from(hashValue, 'base64url')
  const actual = crypto.scryptSync(password, salt, expected.length)

  return (
    expected.length === actual.length &&
    crypto.timingSafeEqual(expected, actual)
  )
}

export function signAdminToken(
  admin: { id: string; email: string; display_name: string },
  maxAgeSeconds: number
) {
  const now = Math.floor(Date.now() / 1000)
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64Url(
    JSON.stringify({
      sub: admin.id,
      email: admin.email,
      name: admin.display_name,
      role: 'admin',
      iat: now,
      exp: now + maxAgeSeconds,
    } satisfies AdminTokenPayload)
  )
  const unsigned = `${header}.${payload}`

  return `${unsigned}.${sign(unsigned)}`
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    const [header, payload, signature] = token.split('.')
    if (!header || !payload || !signature) return null

    const unsigned = `${header}.${payload}`
    const expected = sign(unsigned)
    const expectedBuffer = Buffer.from(expected)
    const actualBuffer = Buffer.from(signature)

    if (
      expectedBuffer.length !== actualBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, actualBuffer)
    ) {
      return null
    }

    const parsed = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    ) as AdminTokenPayload

    if (parsed.role !== 'admin') return null
    if (parsed.exp <= Math.floor(Date.now() / 1000)) return null

    return parsed
  } catch {
    return null
  }
}
