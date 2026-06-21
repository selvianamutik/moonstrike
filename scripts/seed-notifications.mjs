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

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString()
}

async function findUserByEmail(supabase, email) {
  let page = 1

  while (page < 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email)
    if (user) return user
    if (data.users.length < 1000) return null
    page += 1
  }

  return null
}

async function ensureUser(supabase, email, password) {
  const existing = await findUserByEmail(supabase, email)
  if (existing) return existing

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username: 'notification_tester',
      full_name: 'Notification Tester',
      has_email_password: true,
    },
  })

  if (error) throw error
  return data.user
}

async function getAdmins(supabase) {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, display_name, email')
    .eq('status', 'active')
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error('No active admin users found. Run npm run admin:seed first.')
  }

  return data
}

async function getUserOrderRefs(supabase, userId) {
  const { data, error } = await supabase
    .from('orders')
    .select('order_ref')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(6)

  if (error) throw error

  const refs = (data ?? []).map((order) => order.order_ref).filter(Boolean)
  if (refs.length > 0) return refs

  return [
    'MS-NOTIFY-CONFIRMED',
    'MS-NOTIFY-INPROGRESS',
    'MS-NOTIFY-DELIVERED',
    'MS-NOTIFY-COMPLETED',
    'MS-NOTIFY-REFUND-APPROVED',
    'MS-NOTIFY-REFUND-DENIED',
  ]
}

async function cleanupSeedNotifications(supabase) {
  const { data, error } = await supabase
    .from('notifications')
    .delete()
    .like('dedupe_key', 'seed_notification:%')
    .select('id')

  if (error) throw error
  return data?.length ?? 0
}

function customerNotificationRows(userId, orderRefs) {
  const [confirmedRef, inProgressRef, deliveredRef, completedRef, refundApprovedRef, refundDeniedRef] = orderRefs

  return [
    {
      recipient_type: 'customer',
      user_id: userId,
      event_type: 'order_confirmed',
      title: 'Order confirmed',
      body: `${confirmedRef} has been confirmed and is waiting to start.`,
      href: `/profile/orders/${confirmedRef}`,
      metadata: { seed: true, orderRef: confirmedRef },
      dedupe_key: 'seed_notification:customer:order_confirmed',
      read_at: null,
      created_at: minutesAgo(6),
    },
    {
      recipient_type: 'customer',
      user_id: userId,
      event_type: 'order_in_progress',
      title: 'Order in progress',
      body: `${inProgressRef} is now in progress.`,
      href: `/profile/orders/${inProgressRef}`,
      metadata: { seed: true, orderRef: inProgressRef },
      dedupe_key: 'seed_notification:customer:order_in_progress',
      read_at: minutesAgo(4),
      created_at: minutesAgo(8),
    },
    {
      recipient_type: 'customer',
      user_id: userId,
      event_type: 'order_delivered',
      title: 'Your order was delivered',
      body: `${deliveredRef} is ready for your review.`,
      href: `/profile/orders/${deliveredRef}`,
      metadata: { seed: true, orderRef: deliveredRef },
      dedupe_key: 'seed_notification:customer:order_delivered',
      read_at: null,
      created_at: minutesAgo(10),
    },
    {
      recipient_type: 'customer',
      user_id: userId,
      event_type: 'order_completed',
      title: 'Order completed',
      body: `${completedRef} has been marked completed.`,
      href: `/profile/orders/${completedRef}`,
      metadata: { seed: true, orderRef: completedRef },
      dedupe_key: 'seed_notification:customer:order_completed',
      read_at: minutesAgo(12),
      created_at: minutesAgo(14),
    },
    {
      recipient_type: 'customer',
      user_id: userId,
      event_type: 'refund_approved',
      title: 'Refund approved',
      body: `${refundApprovedRef} has been refunded.`,
      href: `/profile/orders/${refundApprovedRef}`,
      metadata: { seed: true, orderRef: refundApprovedRef },
      dedupe_key: 'seed_notification:customer:refund_approved',
      read_at: null,
      created_at: minutesAgo(16),
    },
    {
      recipient_type: 'customer',
      user_id: userId,
      event_type: 'refund_denied',
      title: 'Refund request denied',
      body: `${refundDeniedRef} has returned to its previous order status.`,
      href: `/profile/orders/${refundDeniedRef}`,
      metadata: { seed: true, orderRef: refundDeniedRef },
      dedupe_key: 'seed_notification:customer:refund_denied',
      read_at: minutesAgo(18),
      created_at: minutesAgo(20),
    },
  ].map((row) => ({ ...row, admin_id: null }))
}

function adminNotificationRows(admins, orderRefs) {
  const [orderRef, refundRef, completedRef] = orderRefs

  return admins.flatMap((admin) => [
    {
      recipient_type: 'admin',
      admin_id: admin.id,
      user_id: null,
      event_type: 'order_created',
      title: 'New order received',
      body: `${orderRef} - Seeded notification order`,
      href: `/admin/orders/${orderRef}`,
      metadata: { seed: true, orderRef },
      dedupe_key: `seed_notification:admin:${admin.id}:order_created`,
      read_at: null,
      created_at: minutesAgo(5),
    },
    {
      recipient_type: 'admin',
      admin_id: admin.id,
      user_id: null,
      event_type: 'refund_requested',
      title: 'Refund requested',
      body: `${refundRef} needs review.`,
      href: `/admin/orders/${refundRef}`,
      metadata: { seed: true, orderRef: refundRef },
      dedupe_key: `seed_notification:admin:${admin.id}:refund_requested`,
      read_at: null,
      created_at: minutesAgo(12),
    },
    {
      recipient_type: 'admin',
      admin_id: admin.id,
      user_id: null,
      event_type: 'order_completed',
      title: 'Order completed',
      body: `${completedRef} has been marked completed.`,
      href: `/admin/orders/${completedRef}`,
      metadata: { seed: true, orderRef: completedRef },
      dedupe_key: `seed_notification:admin:${admin.id}:order_completed`,
      read_at: minutesAgo(9),
      created_at: minutesAgo(18),
    },
  ])
}

async function seedNotifications() {
  const user = await ensureUser(supabase, testEmail, testPassword)
  const admins = await getAdmins(supabase)
  const orderRefs = await getUserOrderRefs(supabase, user.id)

  const deletedCount = await cleanupSeedNotifications(supabase)
  const rows = [
    ...customerNotificationRows(user.id, orderRefs),
    ...adminNotificationRows(admins, orderRefs),
  ]

  const { error } = await supabase.from('notifications').insert(rows)
  if (error) throw error

  console.log(`Seeded notifications for customer: ${testEmail}`)
  console.log(`Seeded notifications for ${admins.length} admin account(s).`)
  console.log(`Deleted old seeded notifications: ${deletedCount}`)
  console.log(`Inserted notifications: ${rows.length}`)
  console.log('')
  console.log('Open /notifications as the test user and /admin/notifications as admin.')
  console.log(`Test user password: ${testPassword}`)
}

async function cleanupNotifications() {
  const deletedCount = await cleanupSeedNotifications(supabase)
  console.log(`Deleted seeded notifications: ${deletedCount}`)
}

loadLocalEnv()

const supabaseUrl = required(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = required(
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  'SUPABASE_SECRET_KEY'
)
const testEmail = (process.env.NOTIFICATION_TEST_USER_EMAIL || process.env.REFUND_TEST_USER_EMAIL || 'refund.tester@moonstrike.test').trim().toLowerCase()
const testPassword = process.env.NOTIFICATION_TEST_USER_PASSWORD || process.env.REFUND_TEST_USER_PASSWORD || 'RefundTester123!'

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const command = process.argv[2] ?? 'reseed'
const task = command === 'cleanup' ? cleanupNotifications : seedNotifications

task().catch((error) => {
  console.error(error)
  process.exit(1)
})
