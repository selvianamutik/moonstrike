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

function required(value, name) {
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

async function countRows(supabase, table) {
  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })

  if (error) throw error
  return count ?? 0
}

async function deleteAllRows(supabase, table) {
  const { error } = await supabase
    .from(table)
    .delete()
    .not('id', 'is', null)

  if (error) throw error
}

loadLocalEnv()

const confirm = process.argv.includes('--confirm') || process.env.CHAT_CLEANUP_CONFIRM === 'DELETE'

if (!confirm) {
  throw new Error('Refusing to delete chat history without --confirm. Example: npm run chat:cleanup -- --confirm')
}

const supabaseUrl = required(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = required(
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  'SUPABASE_SECRET_KEY',
)

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const before = {
  messages: await countRows(supabase, 'messages'),
  supportTickets: await countRows(supabase, 'support_tickets'),
}

await deleteAllRows(supabase, 'messages')
await deleteAllRows(supabase, 'support_tickets')

console.log('Cleaned all chat history.')
console.table(before)
