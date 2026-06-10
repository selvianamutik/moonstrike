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

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
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
  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      user_metadata: {
        ...(existing.user_metadata ?? {}),
        username: 'refund_tester',
        full_name: 'Refund Tester',
        has_email_password: true,
      },
    })

    if (error) throw error
    return data.user
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username: 'refund_tester',
      full_name: 'Refund Tester',
      has_email_password: true,
    },
  })

  if (error) throw error
  return data.user
}

async function deleteExistingSeedRows(supabase) {
  const { data: orders, error: orderLookupError } = await supabase
    .from('orders')
    .select('id, checkout_session_id')
    .like('order_ref', 'MS-TEST-%')

  if (orderLookupError) throw orderLookupError

  const orderIds = orders.map((order) => order.id)
  const checkoutSessionIds = orders.map((order) => order.checkout_session_id)

  if (checkoutSessionIds.length > 0) {
    const { error: transactionDeleteError } = await supabase
      .from('transactions')
      .delete()
      .in('checkout_session_id', checkoutSessionIds)

    if (transactionDeleteError) throw transactionDeleteError
  }

  if (orderIds.length > 0) {
    const { error: itemDeleteError } = await supabase
      .from('order_items')
      .delete()
      .in('order_id', orderIds)

    if (itemDeleteError) throw itemDeleteError

    const { error: orderDeleteError } = await supabase
      .from('orders')
      .delete()
      .in('id', orderIds)

    if (orderDeleteError) throw orderDeleteError
  }

  if (checkoutSessionIds.length > 0) {
    const { error: checkoutDeleteError } = await supabase
      .from('checkout_sessions')
      .delete()
      .in('id', checkoutSessionIds)

    if (checkoutDeleteError) throw checkoutDeleteError
  }
}

async function deleteExistingSeedAuditRows(supabase, userId) {
  const { error: auditDeleteError } = await supabase
    .from('audit_logs')
    .delete()
    .ilike('action', `%[refund-test] ${testEmail}%`)

  if (auditDeleteError) throw auditDeleteError

  if (userId) {
    const { error: moderationDeleteError } = await supabase
      .from('user_moderation_events')
      .delete()
      .eq('user_id', userId)

    if (moderationDeleteError) throw moderationDeleteError
  }
}

async function cleanupRefundTestUser() {
  const user = await findUserByEmail(supabase, testEmail)

  await deleteExistingSeedRows(supabase)
  await deleteExistingSeedAuditRows(supabase, user?.id)

  if (!user) {
    console.log(`No refund test user found for ${testEmail}. Seed rows were cleaned.`)
    return
  }

  const { error: cartDeleteError } = await supabase
    .from('carts')
    .delete()
    .eq('user_id', user.id)

  if (cartDeleteError) throw cartDeleteError

  const { data: remainingOrders, error: remainingOrdersError } = await supabase
    .from('orders')
    .select('id, order_ref')
    .eq('user_id', user.id)
    .limit(5)

  if (remainingOrdersError) throw remainingOrdersError

  if (remainingOrders.length > 0) {
    throw new Error(
      `Refusing to delete ${testEmail}: user still has non-seed orders (${remainingOrders
        .map((order) => order.order_ref ?? order.id)
        .join(', ')}).`
    )
  }

  const { data: remainingTransactions, error: remainingTransactionsError } = await supabase
    .from('transactions')
    .select('id')
    .eq('user_id', user.id)
    .limit(5)

  if (remainingTransactionsError) throw remainingTransactionsError

  if (remainingTransactions.length > 0) {
    throw new Error(`Refusing to delete ${testEmail}: user still has non-seed transactions.`)
  }

  const { data: remainingCheckoutSessions, error: remainingCheckoutSessionsError } = await supabase
    .from('checkout_sessions')
    .select('id')
    .eq('user_id', user.id)
    .limit(5)

  if (remainingCheckoutSessionsError) throw remainingCheckoutSessionsError

  if (remainingCheckoutSessions.length > 0) {
    throw new Error(`Refusing to delete ${testEmail}: user still has non-seed checkout sessions.`)
  }

  const { error: userDeleteError } = await supabase.auth.admin.deleteUser(user.id)

  if (userDeleteError) throw userDeleteError

  console.log(`Deleted refund test user and seed data: ${testEmail}`)
}

async function ensureCart(supabase, userId) {
  const { data: existing, error: lookupError } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (lookupError) throw lookupError
  if (existing) return existing.id

  const { data, error } = await supabase
    .from('carts')
    .insert({
      user_id: userId,
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

async function getSeedServices(supabase) {
  const { data, error } = await supabase
    .from('services')
    .select('id, title, base_price_usd, base_price_eur')
    .eq('status', 'active')
    .limit(5)

  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error('No active services found. Run npm run catalog:seed first.')
  }

  return data
}

async function getSeedAdmin(supabase) {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, display_name, email')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

function baseScenarios() {
  return [
    {
      key: 'PENDING',
      status: 'pending',
      provider: 'stripe',
      transactionStatus: 'success',
      refundStatus: 'none',
      createdAt: hoursAgo(8),
      note: 'Refund request should be allowed.',
    },
    {
      key: 'CONFIRMED',
      status: 'confirmed',
      provider: 'stripe',
      transactionStatus: 'success',
      refundStatus: 'none',
      createdAt: hoursAgo(7),
      note: 'Refund request should be allowed.',
    },
    {
      key: 'INPROGRESS',
      status: 'in_progress',
      provider: 'nowpayments',
      transactionStatus: 'success',
      refundStatus: 'none',
      createdAt: hoursAgo(6),
      note: 'Refund request should be allowed. Provider refund is manual/admin-assisted.',
    },
    {
      key: 'DELIVERED',
      status: 'delivered',
      provider: 'stripe',
      transactionStatus: 'success',
      refundStatus: 'none',
      createdAt: daysAgo(1),
      deliveredAt: hoursAgo(10),
      note: 'Refund request should be allowed.',
    },
    {
      key: 'COMPLETED-WINDOW',
      status: 'completed',
      provider: 'stripe',
      transactionStatus: 'success',
      refundStatus: 'none',
      createdAt: daysAgo(3),
      deliveredAt: daysAgo(2),
      completedAt: daysAgo(1),
      note: 'Refund request should be allowed because completed_at is within 7 days.',
    },
    {
      key: 'COMPLETED-EXPIRED',
      status: 'completed',
      provider: 'stripe',
      transactionStatus: 'success',
      refundStatus: 'none',
      createdAt: daysAgo(10),
      deliveredAt: daysAgo(9),
      completedAt: daysAgo(8),
      note: 'Refund request should be blocked because completed_at is older than 7 days.',
    },
    {
      key: 'REQUESTED',
      status: 'refund_requested',
      provider: 'stripe',
      transactionStatus: 'success',
      refundStatus: 'requested',
      createdAt: daysAgo(2),
      deliveredAt: daysAgo(1),
      refundRequestedAt: hoursAgo(3),
      refundPreviousStatus: 'delivered',
      note: 'Refund request should be blocked because it is already under review.',
    },
    {
      key: 'REFUNDED',
      status: 'refunded',
      provider: 'stripe',
      transactionStatus: 'refunded',
      refundStatus: 'refunded',
      createdAt: daysAgo(4),
      deliveredAt: daysAgo(3),
      completedAt: daysAgo(3),
      refundedAt: hoursAgo(12),
      providerRefundId: 're_test_refunded',
      note: 'Refund request should be blocked because it is already refunded.',
    },
  ]
}

function scenarioRows(userId, cartId, services) {
  const scenarios = ['USD', 'EUR'].flatMap((currency) =>
    baseScenarios().map((scenario) => ({
      ...scenario,
      currency,
      ref: `MS-TEST-${currency}-${scenario.key}`,
    })),
  )

  return scenarios.map((scenario, index) => {
    const service = services[index % services.length]
    const baseAmount =
      scenario.currency === 'EUR'
        ? Number(service.base_price_eur || service.base_price_usd || 29)
        : Number(service.base_price_usd || 29)
    const amount = baseAmount + index * 3
    const checkoutSessionId = `test_refund_${scenario.ref.toLowerCase().replaceAll('-', '_')}`

    return {
      scenario,
      checkoutSession: {
        id: checkoutSessionId,
        cart_id: cartId,
        user_id: userId,
        currency: scenario.currency,
        provider: scenario.provider,
        status: 'fulfilled',
        items: [
          {
            serviceId: service.id,
            serviceTitle: service.title,
            quantity: 1,
            total: amount,
            refundRule: scenario.note,
          },
        ],
        created_at: scenario.createdAt,
        fulfilled_at: scenario.createdAt,
      },
      order: {
        user_id: userId,
        checkout_session_id: checkoutSessionId,
        status: scenario.status,
        delivered_at: scenario.deliveredAt ?? null,
        refund_requested_at: scenario.refundRequestedAt ?? null,
        refund_previous_status: scenario.refundPreviousStatus ?? null,
        completed_at: scenario.completedAt ?? null,
        order_ref: scenario.ref,
        created_at: scenario.createdAt,
        updated_at: scenario.refundedAt ?? scenario.refundRequestedAt ?? scenario.completedAt ?? scenario.deliveredAt ?? scenario.createdAt,
      },
      item: {
        service_id: service.id,
        selected_options_snapshot: {
          Quantity: { value: 1, priceUSD: 0, priceEUR: 0 },
          'Refund Test Rule': { value: scenario.note, priceUSD: 0, priceEUR: 0 },
        },
        total: amount,
        currency: scenario.currency,
        created_at: scenario.createdAt,
      },
      transaction: {
        checkout_session_id: checkoutSessionId,
        transaction_ref: scenario.ref.replace('MS-', 'TXN-'),
        user_id: userId,
        provider: scenario.provider,
        provider_payment_id:
          scenario.provider === 'stripe'
            ? `pi_test_${scenario.ref.toLowerCase().replaceAll('-', '_')}`
            : `np_test_${scenario.ref.toLowerCase().replaceAll('-', '_')}`,
        provider_session_id:
          scenario.provider === 'stripe'
            ? `cs_test_${scenario.ref.toLowerCase().replaceAll('-', '_')}`
            : checkoutSessionId,
        amount,
        currency: scenario.currency,
        method: scenario.provider === 'stripe' ? 'Stripe Checkout' : 'NOWPayments Crypto',
        status: scenario.transactionStatus,
        refund_status: scenario.refundStatus,
        refunded_at: scenario.refundedAt ?? null,
        provider_refund_id: scenario.providerRefundId ?? null,
        refund_amount: scenario.refundedAt ? amount : null,
        refund_currency: scenario.refundedAt ? scenario.currency : null,
        refund_category: scenario.refundedAt ? 'customer_request' : null,
        refund_note: scenario.refundedAt ? 'Seeded refunded test order.' : null,
        raw_provider_payload: {
          seed: true,
          refundRule: scenario.note,
          providerRefundMode:
            scenario.provider === 'stripe'
              ? 'Stripe refunds require a real test PaymentIntent to execute the API.'
              : 'NOWPayments crypto refunds are manual/admin-assisted in this app.',
        },
        created_at: scenario.createdAt,
        updated_at: scenario.refundedAt ?? scenario.createdAt,
      },
    }
  })
}

loadLocalEnv()

const supabaseUrl = required(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = required(
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  'SUPABASE_SECRET_KEY'
)
const testEmail = (process.env.REFUND_TEST_USER_EMAIL || 'refund.tester@moonstrike.test').trim().toLowerCase()
const testPassword = process.env.REFUND_TEST_USER_PASSWORD || 'RefundTester123!'

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function seedRefundOrders({ userId, cartId, services }) {
  const rows = scenarioRows(userId, cartId, services)

  const { error: checkoutError } = await supabase
    .from('checkout_sessions')
    .insert(rows.map((row) => row.checkoutSession))

  if (checkoutError) throw checkoutError

  const { data: insertedOrders, error: orderError } = await supabase
    .from('orders')
    .insert(rows.map((row) => row.order))
    .select('id, order_ref')

  if (orderError) throw orderError

  const orderIdByRef = new Map(insertedOrders.map((order) => [order.order_ref, order.id]))

  const { error: itemError } = await supabase
    .from('order_items')
    .insert(rows.map((row) => ({
      ...row.item,
      order_id: orderIdByRef.get(row.scenario.ref),
    })))

  if (itemError) throw itemError

  const { error: transactionError } = await supabase
    .from('transactions')
    .insert(rows.map((row) => row.transaction))

  if (transactionError) throw transactionError

  return rows
}

function auditRowsForRefundTester(userId) {
  const timestamp = new Date().toISOString()
  const actorLabel = testEmail

  return [
    {
      actor_type: 'system',
      actor_label: actorLabel,
      event_type: 'auth',
      action: `[refund-test] ${testEmail} signed in for refund QA`,
      status: 'success',
      timestamp,
    },
    {
      actor_type: 'system',
      actor_label: actorLabel,
      event_type: 'checkout',
      action: `[refund-test] ${testEmail} created Stripe checkout`,
      status: 'success',
      timestamp,
    },
    {
      actor_type: 'system',
      actor_label: actorLabel,
      event_type: 'payment_webhook',
      action: `[refund-test] ${testEmail} NOWPayments webhook blocked sample`,
      status: 'blocked',
      timestamp,
    },
    {
      actor_type: 'system',
      actor_label: actorLabel,
      event_type: 'refund',
      action: `[refund-test] ${testEmail} automatic refund unavailable sample`,
      status: 'blocked',
      timestamp,
    },
    {
      actor_type: 'system',
      actor_label: actorLabel,
      event_type: 'order_lifecycle',
      action: `[refund-test] ${testEmail} confirmed order completion sample`,
      status: 'success',
      timestamp,
    },
    {
      actor_type: 'system',
      actor_label: actorLabel,
      event_type: 'cms',
      action: `[refund-test] ${testEmail} CMS audit visibility sample`,
      status: 'success',
      timestamp,
    },
    {
      actor_type: 'system',
      actor_label: actorLabel,
      event_type: 'settings',
      action: `[refund-test] ${testEmail} settings audit visibility sample`,
      status: 'success',
      timestamp,
    },
    {
      actor_type: 'system',
      actor_label: actorLabel,
      event_type: 'cron',
      action: `[refund-test] ${testEmail} auto-complete cron failed sample`,
      status: 'critical',
      timestamp,
    },
    {
      actor_type: 'system',
      actor_label: actorLabel,
      event_type: 'security',
      action: `[refund-test] ${testEmail} security review blocked sample for ${userId}`,
      status: 'blocked',
      timestamp,
    },
    {
      actor_type: 'system',
      actor_label: actorLabel,
      event_type: 'admin_action',
      action: `[refund-test] ${testEmail} admin review action sample`,
      status: 'success',
      timestamp,
    },
  ]
}

async function seedRefundTesterReviewData(user) {
  await deleteExistingSeedAuditRows(supabase, user.id)

  const admin = await getSeedAdmin(supabase)
  const moderationRows = [
    {
      user_id: user.id,
      admin_id: admin?.id ?? null,
      action: 'banned',
      reason: '[refund-test] Temporary ban sample for moderation history.',
      created_at: daysAgo(5),
    },
    {
      user_id: user.id,
      admin_id: admin?.id ?? null,
      action: 'unbanned',
      reason: '[refund-test] Resolved after identity/payment review.',
      created_at: daysAgo(4),
    },
    {
      user_id: user.id,
      admin_id: admin?.id ?? null,
      action: 'banned',
      reason: '[refund-test] Repeat refund-risk review sample.',
      created_at: daysAgo(2),
    },
    {
      user_id: user.id,
      admin_id: admin?.id ?? null,
      action: 'unbanned',
      reason: '[refund-test] Final QA reset; account active.',
      created_at: daysAgo(1),
    },
  ]

  const { error: moderationError } = await supabase
    .from('user_moderation_events')
    .insert(moderationRows)

  if (moderationError) throw moderationError

  const { error: auditError } = await supabase
    .from('audit_logs')
    .insert(auditRowsForRefundTester(user.id))

  if (auditError) throw auditError
}

async function reseedRefundOrders() {
  const user = await ensureUser(supabase, testEmail, testPassword)
  const cartId = await ensureCart(supabase, user.id)
  const services = await getSeedServices(supabase)

  await deleteExistingSeedRows(supabase)

  const rows = await seedRefundOrders({ userId: user.id, cartId, services })
  await seedRefundTesterReviewData(user)

  console.log(`Seeded refund test user: ${testEmail}`)
  console.log(`Password: ${testPassword}`)
  console.log('Seeded refund test orders:')
  rows.forEach((row) => {
    console.log(`- ${row.scenario.ref}: ${row.scenario.status} (${row.scenario.provider}) - ${row.scenario.note}`)
  })
  console.log('')
  console.log('Seeded related audit events and moderation history for the refund test user.')
  console.log('Note: seeded provider IDs are fake. Use these orders to test refund visibility/status rules.')
  console.log('Stripe refund execution still needs a real Stripe test PaymentIntent. NOWPayments crypto refunds are manual/admin-assisted for now.')
}

const command = process.argv[2] ?? 'reseed'
const task = command === 'cleanup' ? cleanupRefundTestUser : reseedRefundOrders

task().catch((error) => {
  console.error(error)
  process.exit(1)
})
