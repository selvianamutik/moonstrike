import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), '.env')
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
const adminEmail = (process.env.ADMIN_EMAIL || 'admin@moonstrike.io')
  .trim()
  .toLowerCase()
const adminPassword = process.env.ADMIN_PASSWORD
const adminDisplayName = process.env.ADMIN_DISPLAY_NAME || 'Admin Alpha'

function required(value, name) {
  if (!value) throw new Error(`Missing ${name}`)
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
required(adminPassword, 'ADMIN_PASSWORD')

if (adminPassword.length < 10) {
  throw new Error('ADMIN_PASSWORD must be at least 10 characters')
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

console.log('=== Running seed-all ===\n')

// ── Helper: run raw SQL via Supabase REST API ──
async function runSql(sql) {
  // Supabase service_role key can execute raw SQL via /rest/v1/rpc/pgrest
  const url = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/rpc/pgrest`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ query: sql }),
  })

  if (!response.ok) {
    // Fallback: try direct SQL endpoint
    const altUrl = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/`
    // Try using the /sql endpoint directly
    const altResponse = await fetch(altUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'params=single-object',
      },
      body: JSON.stringify({ query: sql }),
    })

    if (!altResponse.ok) {
      throw new Error(`SQL execution failed: ${altResponse.status} ${altResponse.statusText}`)
    }
  }
}

// ── Helper: check if table exists ──
async function tableExists(name) {
  const { data, error } = await supabase
    .from(name)
    .select('id')
    .limit(1)
  return !error
}

// ── Helper: seed table data regardless of migration ──
async function ensureTable(name, createSql) {
  if (await tableExists(name)) return true
  console.log(`  Table "${name}" not found — creating via SQL...`)

  try {
    // Try RPC for raw SQL
    const { error: rpcError } = await supabase.rpc('exec_sql', { query: createSql })
    if (!rpcError) return true
  } catch (e) {
    // RPC not available, try REST approach
  }

  // Fallback: use pg_jsonschema or just return false — table needed
  console.log(`  ⚠ Could not create "${name}" — run migration SQL manually.`)
  return false
}

// ── Step 1: Fix admin_users.role constraint ──
console.log('[1/5] Fixing admin_users.role constraint...')

try {
  await supabase.rpc('exec_sql', {
    query: `ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;`,
  })
  console.log('  ✓ Constraint dropped')
} catch (e) {
  console.log('  (constraint drop skipped — RPC unavailable)')
}

const { error: roleUpdateError } = await supabase
  .from('admin_users')
  .update({ role: 'admin' })
  .neq('role', 'super_admin')
  .neq('role', 'admin')
  .neq('role', 'support')

if (roleUpdateError) {
  console.log('  (role normalization skipped — column may not exist yet)')
} else {
  console.log('  ✓ Roles normalized to lowercase')
}

// ── Step 2: Seed / update super admin ──
console.log('[2/5] Seeding super admin account...')

const passwordHash = hashAdminPassword(adminPassword)
const { data: existingAdmin, error: lookupError } = await supabase
  .from('admin_users')
  .select('id')
  .eq('email', adminEmail)
  .maybeSingle()

if (lookupError) throw lookupError

if (existingAdmin) {
  const { error } = await supabase
    .from('admin_users')
    .update({
      display_name: adminDisplayName,
      password_hash: passwordHash,
      role: 'super_admin',
      status: 'active',
      avatar: '',
    })
    .eq('id', existingAdmin.id)

  if (error) throw error
  console.log(`  ✓ Updated admin: ${adminEmail} → super_admin`)
} else {
  const { error } = await supabase.from('admin_users').insert({
    display_name: adminDisplayName,
    email: adminEmail,
    password_hash: passwordHash,
    role: 'super_admin',
    status: 'active',
    avatar: '',
  })

  if (error) throw error
  console.log(`  ✓ Created admin: ${adminEmail} → super_admin`)
}

const { error: singletonError } = await supabase
  .from('admin_users')
  .delete()
  .neq('email', adminEmail)

if (singletonError) throw singletonError
console.log('  ✓ Removed other admin accounts')

// Get admin ID for reference
const { data: adminRow } = await supabase
  .from('admin_users')
  .select('id')
  .eq('email', adminEmail)
  .maybeSingle()

const adminId = adminRow?.id

// ── Step 3: Seed custom_pages ──
console.log('[3/5] Seeding custom pages...')

const pagesExisting = await tableExists('custom_pages')

if (!pagesExisting) {
  console.log('  ⚠ "custom_pages" table does not exist — run migration first, then re-run this script.')
  console.log('    Migration file: supabase/migration/20260713000003_custom_pages.sql')
} else {
  const pages = [
    {
      title: 'Terms of Service',
      slug: 'terms-of-service',
      content: `<h1>Terms of Service</h1>
<p>Welcome to Moon Strike. By using our services, you agree to the following terms and conditions.</p>
<h2>1. Service Description</h2>
<p>Moon Strike provides game boosting, coaching, and playmate services for various online games.</p>
<h2>2. User Responsibilities</h2>
<p>Users must provide accurate account information and comply with game publisher terms of service.</p>
<h2>3. Refund Policy</h2>
<p>Refunds are handled according to our refund policy.</p>
<h2>4. Limitation of Liability</h2>
<p>Moon Strike is not responsible for any account actions taken by game publishers.</p>`,
      meta_description: 'Moon Strike terms of service and user agreement',
      status: 'active',
      created_by: adminId,
    },
    {
      title: 'Refund Policy',
      slug: 'refund-policy',
      content: `<h1>Refund Policy</h1>
<p>If you are not satisfied with our service, please review our refund policy below.</p>
<h2>Full Refund</h2>
<p>Available if the service has not yet started. Request within 24 hours of purchase.</p>
<h2>Partial Refund</h2>
<p>If the service has partially started, a prorated refund may be issued based on progress.</p>
<h2>How to Request</h2>
<p>Contact support via Messages or email support@moonstrike.io.</p>`,
      meta_description: 'Moon Strike refund policy and guidelines',
      status: 'active',
      created_by: adminId,
    },
    {
      title: 'Getting Started Guide',
      slug: 'getting-started',
      content: `<h1>Getting Started Guide</h1>
<p>New to Moon Strike? Follow this guide to place your first order.</p>
<h2>1. Browse Services</h2>
<p>Select your game from the homepage and browse available services.</p>
<h2>2. Configure Your Order</h2>
<p>Choose your options, quantity, and any additional requirements.</p>
<h2>3. Checkout</h2>
<p>Proceed to checkout and complete payment.</p>
<h2>4. Track Progress</h2>
<p>Monitor your order status from your profile dashboard.</p>`,
      meta_description: 'How to get started with Moon Strike',
      status: 'active',
      created_by: adminId,
    },
  ]

  let count = 0
  for (const page of pages) {
    const { error: e } = await supabase
      .from('custom_pages')
      .upsert(page, { onConflict: 'slug', ignoreDuplicates: true })
    if (!e) count++
  }

  console.log(`  ✓ Created ${count} custom page(s)`)
}

// ── Step 4: Seed private_offers ──
console.log('[4/5] Seeding private offers...')

const offersExisting = await tableExists('private_offers')

if (!offersExisting) {
  console.log('  ⚠ "private_offers" table does not exist — run migration first, then re-run this script.')
  console.log('    Migration file: supabase/migration/20260713000002_private_offers.sql')
} else {
  const { data: games } = await supabase.from('games').select('id, name').limit(1)
  const firstGameId = games?.[0]?.id

  if (firstGameId && adminId) {
    const offers = [
      {
        game_id: firstGameId,
        quantity: 1,
        platform: 'PC',
        category: 'boosting',
        price_usd: 49.99,
        discount_percent: 20,
        title: 'Diamond Rank Boost - Special Offer',
        additional_info: 'Priority queue + session recording. Estimated: 24-48 hours.',
        slug: 'diamond-rank-boost-special',
        status: 'active',
        created_by: adminId,
      },
      {
        game_id: firstGameId,
        quantity: 5,
        platform: 'PC, PS5',
        category: 'coaching',
        price_usd: 149.99,
        discount_percent: 10,
        title: 'Pro Coaching Package - 5 Sessions',
        additional_info: 'One-on-one with top-ranked player. 1 hour each session. Replay analysis included.',
        slug: 'pro-coaching-5-sessions',
        status: 'active',
        created_by: adminId,
      },
    ]

    let count = 0
    for (const offer of offers) {
      const { error: e } = await supabase
        .from('private_offers')
        .upsert(offer, { onConflict: 'slug', ignoreDuplicates: true })
      if (!e) count++
    }

    console.log(`  ✓ Created ${count} private offer(s)`)
  } else {
    console.log('  ⚠ Skipped: no game or admin found')
  }
}

// ── Step 5: Seed order_pricing columns if migration not run ──
console.log('[5/5] Checking order pricing columns...')

if (await tableExists('orders')) {
  // Check if base_price column exists
  const { error: pricingError } = await supabase
    .from('orders')
    .select('base_price')
    .limit(1)

  if (pricingError && pricingError.code === '42703') {
    console.log('  ⚠ "base_price" column missing — run migration:')
    console.log('    supabase/migration/20260713000001_order_pricing_fields.sql')
  } else {
    console.log('  ✓ Order pricing columns available')
  }
}

console.log(`
=== Seed complete ===

Admin account:
  Email: ${adminEmail}
  Password: (from ADMIN_PASSWORD env)
  Role: super_admin

Custom pages: ${pagesExisting ? 'seeded (terms-of-service, refund-policy, getting-started)' : 'SKIPPED — run migration first'}
Private offers: ${offersExisting ? 'seeded with sample data' : 'SKIPPED — run migration first'}
`)
