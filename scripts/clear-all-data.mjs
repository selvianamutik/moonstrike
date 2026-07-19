import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadLocalEnv() {
  const envFiles = ['.env.local', '.env']
  
  for (const envFile of envFiles) {
    const envPath = path.join(process.cwd(), envFile)
    if (!fs.existsSync(envPath)) continue

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
}

function required(value, name) {
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

loadLocalEnv()

const supabaseUrl = required(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = required(
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  'SUPABASE_SECRET_KEY'
)

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function clearTable(tableName) {
  try {
    const { error, count } = await supabase
      .from(tableName)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows

    if (error) {
      console.error(`❌ Failed to clear ${tableName}:`, error.message)
      return false
    }

    console.log(`✅ Cleared ${tableName} (${count ?? 'all'} rows deleted)`)
    return true
  } catch (err) {
    console.error(`❌ Error clearing ${tableName}:`, err.message)
    return false
  }
}

async function main() {
  console.log('\n🗑️  Starting COMPLETE database cleanup...')
  console.log('⚠️  ⚠️  ⚠️  WARNING: This will delete ALL DATA including games and services! ⚠️  ⚠️  ⚠️\n')

  // All tables in order (respecting foreign key constraints)
  const tablesToClear = [
    // Messages first (depends on support_tickets)
    'messages',
    
    // Support tickets (depends on orders)
    'support_tickets',
    
    // Order related (depends on cart_items and services)
    'sheets_sync_jobs',
    'order_items',
    'transactions',
    'orders',
    
    // Cart related
    'cart_items',
    'carts',
    
    // Checkout sessions
    'checkout_sessions',
    
    // Notifications
    'notifications',
    
    // User moderation
    'user_moderation_events',
    
    // Login attempts
    'customer_login_attempts',
    
    // Audit logs
    'audit_logs',
    
    // CMS content (depends on games and admin_users)
    'content_blocks',
    'promo_banners',
    'hero_banners',
    'media_assets',
    
    // System settings
    'system_settings',
    
    // Services (depends on games and service_categories)
    'services',
    
    // Service categories (depends on games)
    'service_categories',
    
    // Games (depends on genres)
    'games',
    
    // Genres (no dependencies)
    'genres',
    
    // Admin users (last, as it's referenced by many tables)
    'admin_users',
  ]

  let successCount = 0
  let failCount = 0

  for (const table of tablesToClear) {
    const success = await clearTable(table)
    if (success) {
      successCount++
    } else {
      failCount++
    }
  }

  console.log('\n📊 Summary:')
  console.log(`   ✅ Successfully cleared: ${successCount} tables`)
  console.log(`   ❌ Failed to clear: ${failCount} tables`)
  console.log('\n🔥 ALL DATA HAS BEEN DELETED!')
  console.log('💡 You can now seed fresh production data\n')
}

main().catch((error) => {
  console.error('\n💥 Fatal error:', error)
  process.exit(1)
})
