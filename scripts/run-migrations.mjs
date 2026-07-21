import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    process.env[trimmed.slice(0, idx).trim()] ??= trimmed.slice(idx + 1).trim()
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const migrationDir = path.join(process.cwd(), 'supabase', 'migration')
const files = [
  '20260713000001_order_pricing_fields.sql',
  '20260713000002_private_offers.sql',
  '20260713000003_custom_pages.sql',
  '20260713000004_admin_roles.sql',
  '20260717000001_custom_pages_category.sql',
  '20260717000002_custom_pages_image.sql',
  '20260717000003_custom_pages_public_read.sql',
]

for (const file of files) {
  const filePath = path.join(migrationDir, file)
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠ ${file} not found, skipping`)
    continue
  }

  const sql = fs.readFileSync(filePath, 'utf8')
  console.log(`Running ${file}...`)

  try {
    const { error } = await supabase.rpc('exec_sql', { query: sql })
    if (error) throw error
    console.log(`  ✓ ${file}`)
  } catch (e) {
    // RPC not available — try REST API directly
    const url = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ query: sql }),
    }).catch(() => null)

    if (!response || !response.ok) {
      console.log(`  ⚠ Cannot run ${file} via API — execute manually in Supabase SQL Editor`)
      console.log(`    File: ${filePath}`)
    } else {
      console.log(`  ✓ ${file}`)
    }
  }
}

console.log('\nDone. Now run: node scripts/seed-all.mjs')
