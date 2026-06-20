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
  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      user_metadata: {
        ...(existing.user_metadata ?? {}),
        username: existing.user_metadata?.username ?? 'chat_tester',
        full_name: existing.user_metadata?.full_name ?? 'Chat Tester',
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
      username: 'chat_tester',
      full_name: 'Chat Tester',
      has_email_password: true,
    },
  })

  if (error) throw error
  return data.user
}

async function getSeedAdmin(supabase) {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, display_name, email')
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('No active admin user found. Run npm run admin:seed first.')
  return data
}

async function getChatOrder(supabase, userId) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_ref')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

async function deleteTickets(supabase, ticketIds) {
  if (ticketIds.length === 0) return 0

  const { error: messageError } = await supabase
    .from('messages')
    .delete()
    .in('ticket_id', ticketIds)

  if (messageError) throw messageError

  const { error: ticketError } = await supabase
    .from('support_tickets')
    .delete()
    .in('id', ticketIds)

  if (ticketError) throw ticketError
  return ticketIds.length
}

async function cleanupChatSeed(supabase, userId) {
  const order = await getChatOrder(supabase, userId)

  const queries = [
    supabase
      .from('support_tickets')
      .select('id')
      .eq('user_id', userId)
      .is('order_id', null),
  ]

  if (order) {
    queries.push(
      supabase
        .from('support_tickets')
        .select('id')
        .eq('order_id', order.id),
    )
  }

  const results = await Promise.all(queries)
  const ticketIds = []

  for (const result of results) {
    if (result.error) throw result.error
    ticketIds.push(...(result.data ?? []).map((ticket) => ticket.id))
  }

  return deleteTickets(supabase, [...new Set(ticketIds)])
}

function supportMessages(ticketId, userId, adminId) {
  return [
    {
      ticket_id: ticketId,
      sender_id: userId,
      sender_role: 'customer',
      content: 'Hi, I want to check whether my account details are enough for this order.',
      attachments: [],
      sent_at: minutesAgo(34),
    },
    {
      ticket_id: ticketId,
      sender_id: adminId,
      sender_role: 'admin',
      content: 'Sure, send the current rank and server region here. I will verify it first.',
      attachments: [],
      sent_at: minutesAgo(29),
    },
    {
      ticket_id: ticketId,
      sender_id: userId,
      sender_role: 'customer',
      content: 'Current rank is Gold III. I can also buy a level-up service if needed.',
      attachments: [
        {
          type: 'link',
          linkType: 'service',
          title: 'Seeded related service',
          href: '/services',
          meta: 'Shared service link seed',
        },
      ],
      sent_at: minutesAgo(18),
    },
    {
      ticket_id: ticketId,
      sender_id: adminId,
      sender_role: 'admin',
      content: 'That should work. I left one note in the order requirements.',
      attachments: [],
      sent_at: minutesAgo(13),
    },
    {
      ticket_id: ticketId,
      sender_id: userId,
      sender_role: 'customer',
      content: 'Thanks, please keep me updated here.',
      attachments: [],
      sent_at: minutesAgo(4),
    },
  ]
}

function orderMessages(ticketId, userId, adminId, orderRef) {
  return [
    {
      ticket_id: ticketId,
      sender_id: adminId,
      sender_role: 'admin',
      content: `Order chat opened for ${orderRef}. We will post delivery updates here.`,
      attachments: [],
      sent_at: minutesAgo(42),
    },
    {
      ticket_id: ticketId,
      sender_id: userId,
      sender_role: 'customer',
      content: 'Great. Please let me know before starting the session.',
      attachments: [],
      sent_at: minutesAgo(36),
    },
    {
      ticket_id: ticketId,
      sender_id: adminId,
      sender_role: 'admin',
      content: 'The booster is preparing the lobby now.',
      attachments: [],
      sent_at: minutesAgo(22),
    },
    {
      ticket_id: ticketId,
      sender_id: userId,
      sender_role: 'customer',
      content: 'I am ready whenever the team is ready.',
      attachments: [],
      sent_at: minutesAgo(11),
    },
    {
      ticket_id: ticketId,
      sender_id: adminId,
      sender_role: 'admin',
      content: 'Confirmed. We will start shortly.',
      attachments: [],
      sent_at: minutesAgo(3),
    },
  ]
}

async function insertTicket(supabase, row) {
  const { data, error } = await supabase
    .from('support_tickets')
    .insert(row)
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

async function seedChat() {
  const user = await ensureUser(supabase, testEmail, testPassword)
  const admin = await getSeedAdmin(supabase)
  const order = await getChatOrder(supabase, user.id)
  const deletedCount = await cleanupChatSeed(supabase, user.id)

  const supportTicketId = await insertTicket(supabase, {
    user_id: user.id,
    order_id: null,
    session_id: null,
    subject: 'General Support',
    status: 'open',
    admin_last_read_at: minutesAgo(20),
    customer_last_read_at: minutesAgo(16),
    created_at: minutesAgo(36),
    updated_at: minutesAgo(4),
  })

  const messages = [...supportMessages(supportTicketId, user.id, admin.id)]

  let orderTicketId = null
  if (order) {
    orderTicketId = await insertTicket(supabase, {
      user_id: user.id,
      order_id: order.id,
      session_id: null,
      subject: `Order ${order.order_ref}`,
      status: 'open',
      admin_last_read_at: minutesAgo(12),
      customer_last_read_at: minutesAgo(23),
      created_at: minutesAgo(44),
      updated_at: minutesAgo(3),
    })

    messages.push(...orderMessages(orderTicketId, user.id, admin.id, order.order_ref))
  }

  const { error: messageError } = await supabase.from('messages').insert(messages)
  if (messageError) throw messageError

  console.log(`Seeded chat test user: ${testEmail}`)
  console.log(`Password: ${testPassword}`)
  console.log(`Deleted old chat tickets for test user: ${deletedCount}`)
  console.log(`Seeded support ticket: ${supportTicketId}`)
  if (orderTicketId) {
    console.log(`Seeded order ticket: ${orderTicketId} (${order.order_ref})`)
  } else {
    console.log('No order ticket seeded because the test user has no orders. Run npm.cmd run refund-orders:seed first if you want order chat.')
  }
  console.log(`Inserted messages: ${messages.length}`)
}

async function cleanupChat() {
  const user = await findUserByEmail(supabase, testEmail)
  if (!user) {
    console.log(`No chat test user found for ${testEmail}.`)
    return
  }

  const deletedCount = await cleanupChatSeed(supabase, user.id)
  console.log(`Deleted chat tickets for ${testEmail}: ${deletedCount}`)
}

loadLocalEnv()

const supabaseUrl = required(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL')
const supabaseKey = required(
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  'SUPABASE_SECRET_KEY'
)
const testEmail = (process.env.CHAT_TEST_USER_EMAIL || process.env.REFUND_TEST_USER_EMAIL || 'refund.tester@moonstrike.test').trim().toLowerCase()
const testPassword = process.env.CHAT_TEST_USER_PASSWORD || process.env.REFUND_TEST_USER_PASSWORD || 'RefundTester123!'

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const command = process.argv[2] ?? 'reseed'
const task = command === 'cleanup' ? cleanupChat : seedChat

task().catch((error) => {
  console.error(error)
  process.exit(1)
})
