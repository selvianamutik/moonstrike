import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const equalsIndex = trimmed.indexOf('=')
    if (equalsIndex === -1) continue

    const key = trimmed.slice(0, equalsIndex).trim()
    let value = trimmed.slice(equalsIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[key] ??= value
  }
}

loadLocalEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const email = (process.env.ADMIN_EMAIL || 'admin@moonstrike.io')
  .trim()
  .toLowerCase()
const password = process.env.ADMIN_PASSWORD
const displayName = process.env.ADMIN_DISPLAY_NAME || 'Admin Alpha'

function required(value, name) {
  if (!value) {
    throw new Error(`Missing ${name}`)
  }

  return value
}

function base64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

function hashAdminPassword(value) {
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(value, salt, 64)
  return `scrypt$${base64Url(salt)}$${base64Url(hash)}`
}

required(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL')
required(supabaseKey, 'SUPABASE_SECRET_KEY')
required(password, 'ADMIN_PASSWORD')

if (password.length < 10) {
  throw new Error('ADMIN_PASSWORD must be at least 10 characters')
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const passwordHash = hashAdminPassword(password)
const { data: existingAdmin, error: lookupError } = await supabase
  .from('admin_users')
  .select('id')
  .eq('email', email)
  .maybeSingle()

if (lookupError) {
  throw lookupError
}

if (existingAdmin) {
  const { error } = await supabase
    .from('admin_users')
    .update({
      display_name: displayName,
      password_hash: passwordHash,
      role: 'ADMIN',
      status: 'active',
      avatar: '',
    })
    .eq('id', existingAdmin.id)

  if (error) throw error
} else {
  const { error } = await supabase.from('admin_users').insert({
    display_name: displayName,
    email,
    password_hash: passwordHash,
    role: 'ADMIN',
    status: 'active',
    avatar: '',
  })

  if (error) throw error
}

const { error: singletonError } = await supabase
  .from('admin_users')
  .delete()
  .neq('email', email)

if (singletonError) {
  throw singletonError
}

console.log(`Seeded admin account: ${email}`)
