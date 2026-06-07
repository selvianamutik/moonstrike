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

function parseArgs() {
  const args = process.argv.slice(2)
  const emailArg = args.find((arg) => !arg.startsWith('--'))
  const email = (emailArg || process.env.USER_CLEANUP_EMAIL || '').trim().toLowerCase()

  return {
    email,
    confirm: args.includes('--confirm') || process.env.USER_CLEANUP_CONFIRM === 'DELETE',
    keepAuthUser: args.includes('--keep-auth-user'),
  }
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

async function selectIds(supabase, table, column, value) {
  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq(column, value)

  if (error) throw error
  return (data ?? []).map((row) => row.id)
}

async function deleteByIds(supabase, table, ids) {
  if (ids.length === 0) return 0

  const { error } = await supabase
    .from(table)
    .delete()
    .in('id', ids)

  if (error) throw error
  return ids.length
}

async function cleanupUserData({ supabase, userId, keepAuthUser }) {
  const cartIds = await selectIds(supabase, 'carts', 'user_id', userId)
  const orderIds = await selectIds(supabase, 'orders', 'user_id', userId)
  const checkoutSessionIds = await selectIds(supabase, 'checkout_sessions', 'user_id', userId)
  const ticketIds = await selectIds(supabase, 'support_tickets', 'user_id', userId)

  const summary = {
    messages: 0,
    supportTickets: ticketIds.length,
    transactions: 0,
    orderItems: 0,
    orders: orderIds.length,
    cartItems: 0,
    carts: cartIds.length,
    checkoutSessions: checkoutSessionIds.length,
    authUser: keepAuthUser ? 0 : 1,
  }

  if (ticketIds.length > 0) {
    const { data: messages, error: messageLookupError } = await supabase
      .from('messages')
      .select('id')
      .in('ticket_id', ticketIds)

    if (messageLookupError) throw messageLookupError
    summary.messages = await deleteByIds(supabase, 'messages', (messages ?? []).map((message) => message.id))
  }

  await deleteByIds(supabase, 'support_tickets', ticketIds)

  if (checkoutSessionIds.length > 0) {
    const { data: transactions, error: transactionLookupError } = await supabase
      .from('transactions')
      .select('id')
      .in('checkout_session_id', checkoutSessionIds)

    if (transactionLookupError) throw transactionLookupError
    summary.transactions = await deleteByIds(supabase, 'transactions', (transactions ?? []).map((transaction) => transaction.id))
  }

  if (orderIds.length > 0) {
    const { data: orderItems, error: orderItemLookupError } = await supabase
      .from('order_items')
      .select('id')
      .in('order_id', orderIds)

    if (orderItemLookupError) throw orderItemLookupError
    summary.orderItems = await deleteByIds(supabase, 'order_items', (orderItems ?? []).map((item) => item.id))
  }

  await deleteByIds(supabase, 'orders', orderIds)

  if (cartIds.length > 0) {
    const { data: cartItems, error: cartItemLookupError } = await supabase
      .from('cart_items')
      .select('id')
      .in('cart_id', cartIds)

    if (cartItemLookupError) throw cartItemLookupError
    summary.cartItems = await deleteByIds(supabase, 'cart_items', (cartItems ?? []).map((item) => item.id))
  }

  await deleteByIds(supabase, 'carts', cartIds)

  await deleteByIds(supabase, 'checkout_sessions', checkoutSessionIds)

  return summary
}

loadLocalEnv()

const { email, confirm, keepAuthUser } = parseArgs()
const supabaseUrl = required(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = required(
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  'SUPABASE_SECRET_KEY'
)

if (!email) {
  throw new Error('Provide an email: npm run user-data:cleanup -- user@example.com --confirm')
}

if (!confirm) {
  throw new Error('Refusing to delete without --confirm. Example: npm run user-data:cleanup -- user@example.com --confirm')
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const user = await findUserByEmail(supabase, email)

if (!user) {
  console.log(`No Supabase Auth user found for ${email}. Nothing to clean.`)
  process.exit(0)
}

const summary = await cleanupUserData({ supabase, userId: user.id, keepAuthUser })

if (!keepAuthUser) {
  const { error } = await supabase.auth.admin.deleteUser(user.id)
  if (error) throw error
}

console.log(`Cleaned user data for ${email}`)
console.table(summary)
