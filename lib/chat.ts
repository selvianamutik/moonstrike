import type { User } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserDisplayName, getUserInitials } from '@/lib/auth/user-display'

export const CHAT_COOKIE = 'ms_chat_session'
const CHAT_COOKIE_MAX_AGE = 60 * 60
const LOGGED_IN_SUPPORT_CHAT_RETENTION_DAYS = 90
const ORDER_CHAT_RETENTION_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

export type ChatTicketStatus = 'open' | 'in_progress' | 'resolved'
export type ChatSenderRole = 'admin' | 'customer'

export type ChatAttachment =
  | {
      type: 'image'
      url: string
      filename: string
      sizeBytes: number
      storagePath?: string
    }
  | {
      type: 'link'
      linkType: 'game' | 'service'
      title: string
      href: string
      image?: string
      meta?: string
    }

export type ChatTicket = {
  id: string
  orderId: string | null
  orderRef: string | null
  userId: string | null
  sessionId: string | null
  subject: string
  status: ChatTicketStatus
  createdAt: string
  updatedAt: string
  customerName: string
  customerEmail: string | null
  customerInitials: string
  latestMessage: string
  latestMessageAt: string | null
  unreadCount: number
}

export type ChatMessage = {
  id: string
  ticketId: string
  senderId: string
  senderRole: ChatSenderRole
  content: string
  attachments: ChatAttachment[]
  sentAt: string
}

export type ChatMessagePage = {
  messages: ChatMessage[]
  hasMore: boolean
}

type TicketRow = {
  id: string
  order_id: string | null
  user_id: string | null
  session_id?: string | null
  subject: string
  status: ChatTicketStatus
  created_at: string
  updated_at: string
  admin_last_read_at?: string
  customer_last_read_at?: string
  orders?: { order_ref: string | null } | { order_ref: string | null }[] | null
}

type RetentionOrderRow = {
  status: string
  completed_at: string | null
  updated_at: string
}

type RetentionTicketRow = {
  id: string
  order_id: string | null
  user_id: string | null
  session_id: string | null
  updated_at: string
  orders?: RetentionOrderRow | RetentionOrderRow[] | null
}

type CookieStore = Awaited<ReturnType<typeof cookies>>

type MessageRow = {
  id: string
  ticket_id: string
  sender_id: string
  sender_role: ChatSenderRole
  content: string
  attachments: ChatAttachment[] | null
  sent_at: string
}

const ticketSelect =
  'id, order_id, user_id, session_id, subject, status, created_at, updated_at, admin_last_read_at, customer_last_read_at, orders(order_ref)'

function relationOne<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function toMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    senderId: row.sender_id,
    senderRole: row.sender_role,
    content: row.content,
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    sentAt: row.sent_at,
  }
}

function userLabel(user: User | null | undefined, fallback: string) {
  if (!user) return { name: fallback, email: null, initials: getUserInitials(fallback) }

  const name = getUserDisplayName(user)
  return {
    name,
    email: user.email ?? null,
    initials: getUserInitials(name, user.email),
  }
}

function toTicket(row: TicketRow, user: User | null | undefined, latestMessage?: MessageRow, unreadCount = 0): ChatTicket {
  const order = relationOne(row.orders)
  const customer = userLabel(user, row.user_id ? 'Customer' : 'Guest')

  return {
    id: row.id,
    orderId: row.order_id,
    orderRef: order?.order_ref ?? null,
    userId: row.user_id,
    sessionId: row.session_id ?? null,
    subject: row.subject,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customerName: customer.name,
    customerEmail: customer.email,
    customerInitials: customer.initials,
    latestMessage: latestMessage?.content ?? '',
    latestMessageAt: latestMessage?.sent_at ?? null,
    unreadCount,
  }
}

function ticketSortTime(ticket: ChatTicket) {
  return ticket.latestMessageAt ?? ticket.createdAt
}

function logicalTicketKey(ticket: ChatTicket) {
  if (ticket.orderId) return `order:${ticket.orderId}`
  if (ticket.userId) return `customer-general:${ticket.userId}`
  if (ticket.sessionId) return `anonymous-general:${ticket.sessionId}`
  return `ticket:${ticket.id}`
}

function sortTicketsByLatestActivity(tickets: ChatTicket[]) {
  return tickets.sort((a, b) => ticketSortTime(b).localeCompare(ticketSortTime(a)))
}

function uniqueLogicalTickets(tickets: ChatTicket[]) {
  const unique = new Map<string, ChatTicket>()

  for (const ticket of sortTicketsByLatestActivity([...tickets])) {
    const key = logicalTicketKey(ticket)
    if (!unique.has(key)) unique.set(key, ticket)
  }

  return [...unique.values()]
}

function isUniqueViolation(error: { code?: string } | null | undefined) {
  return error?.code === '23505'
}

function setChatSessionCookie(cookieStore: CookieStore, sessionId: string) {
  cookieStore.set(CHAT_COOKIE, sessionId, {
    httpOnly: true,
    maxAge: CHAT_COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}

export async function getOrCreateChatSessionId() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(CHAT_COOKIE)?.value || randomUUID()
  setChatSessionCookie(cookieStore, sessionId)
  return sessionId
}

export async function getCurrentChatSessionId() {
  const cookieStore = await cookies()
  return cookieStore.get(CHAT_COOKIE)?.value ?? null
}

export async function refreshCurrentChatSession() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(CHAT_COOKIE)?.value
  if (!sessionId) return null

  setChatSessionCookie(cookieStore, sessionId)
  return sessionId
}

export async function clearChatSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(CHAT_COOKIE)
}

async function userMapForTickets(userIds: string[]) {
  const supabase = createAdminClient()
  const uniqueIds = [...new Set(userIds.filter(Boolean))]
  const entries = await Promise.all(
    uniqueIds.map(async (id) => {
      const { data } = await supabase.auth.admin.getUserById(id)
      return [id, data.user ?? null] as const
    }),
  )

  return new Map(entries)
}

async function latestMessagesForTickets(ticketIds: string[]) {
  if (ticketIds.length === 0) return new Map<string, MessageRow>()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('messages')
    .select('id, ticket_id, sender_id, sender_role, content, attachments, sent_at')
    .in('ticket_id', ticketIds)
    .order('sent_at', { ascending: false })

  if (error) throw error

  const latest = new Map<string, MessageRow>()
  for (const row of (data ?? []) as MessageRow[]) {
    if (!latest.has(row.ticket_id)) latest.set(row.ticket_id, row)
  }
  return latest
}

async function unreadCustomerMessagesForTickets(rows: TicketRow[]) {
  const ticketIds = rows.map((row) => row.id)
  if (ticketIds.length === 0) return new Map<string, number>()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('messages')
    .select('ticket_id, sent_at')
    .in('ticket_id', ticketIds)
    .eq('sender_role', 'customer')

  if (error) throw error

  const readAtByTicket = new Map(rows.map((row) => [row.id, row.admin_last_read_at ?? row.created_at]))
  const unread = new Map<string, number>()

  for (const row of (data ?? []) as Pick<MessageRow, 'ticket_id' | 'sent_at'>[]) {
    const readAt = readAtByTicket.get(row.ticket_id)
    if (!readAt || row.sent_at > readAt) {
      unread.set(row.ticket_id, (unread.get(row.ticket_id) ?? 0) + 1)
    }
  }

  return unread
}

async function unreadAdminMessagesForTickets(rows: TicketRow[]) {
  const ticketIds = rows.map((row) => row.id)
  if (ticketIds.length === 0) return new Map<string, number>()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('messages')
    .select('ticket_id, sent_at')
    .in('ticket_id', ticketIds)
    .eq('sender_role', 'admin')

  if (error) throw error

  const readAtByTicket = new Map(rows.map((row) => [row.id, row.customer_last_read_at ?? row.created_at]))
  const unread = new Map<string, number>()

  for (const row of (data ?? []) as Pick<MessageRow, 'ticket_id' | 'sent_at'>[]) {
    const readAt = readAtByTicket.get(row.ticket_id)
    if (!readAt || row.sent_at > readAt) {
      unread.set(row.ticket_id, (unread.get(row.ticket_id) ?? 0) + 1)
    }
  }

  return unread
}

export async function getOrCreateCustomerTicket(user: User, orderRef?: string | null) {
  const supabase = createAdminClient()
  let orderId: string | null = null
  let subject = 'General Support'

  if (orderRef) {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_ref')
      .eq('user_id', user.id)
      .eq('order_ref', orderRef)
      .maybeSingle<{ id: string; order_ref: string }>()

    if (orderError) throw orderError
    if (!order) throw new Error('Order not found.')

    orderId = order.id
    subject = `Order ${order.order_ref}`
  }

  async function findExistingTicket() {
    let query = supabase
      .from('support_tickets')
      .select(ticketSelect)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)

    query = orderId ? query.eq('order_id', orderId) : query.is('order_id', null)

    return query.maybeSingle<TicketRow>()
  }

  const { data: existing, error: existingError } = await findExistingTicket()
  if (existingError) throw existingError

  if (existing) return toTicket(existing, user)

  const { data: ticket, error: insertError } = await supabase
    .from('support_tickets')
    .insert({
      order_id: orderId,
      user_id: user.id,
      subject,
      status: 'open',
    })
    .select(ticketSelect)
    .single<TicketRow>()

  if (insertError) {
    if (isUniqueViolation(insertError)) {
      const { data: racedTicket, error: racedLookupError } = await findExistingTicket()
      if (racedLookupError) throw racedLookupError
      if (racedTicket) return toTicket(racedTicket, user)
    }

    throw insertError
  }

  return toTicket(ticket, user)
}

export async function getOrCreateOrderTicketForAdmin(orderRef: string) {
  const supabase = createAdminClient()

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, user_id, order_ref')
    .eq('order_ref', orderRef)
    .maybeSingle<{ id: string; user_id: string; order_ref: string }>()

  if (orderError) throw orderError
  if (!order) throw new Error('Order not found.')
  const resolvedOrder = order

  async function findExistingTicket() {
    return supabase
      .from('support_tickets')
      .select(ticketSelect)
      .eq('order_id', resolvedOrder.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle<TicketRow>()
  }

  const { data: existing, error: existingError } = await findExistingTicket()
  if (existingError) throw existingError

  const { data: userData } = await supabase.auth.admin.getUserById(resolvedOrder.user_id)
  const user = userData.user ?? null

  if (existing) return toTicket(existing, user)

  const { data: ticket, error: insertError } = await supabase
    .from('support_tickets')
    .insert({
      order_id: resolvedOrder.id,
      user_id: resolvedOrder.user_id,
      subject: `Order ${resolvedOrder.order_ref}`,
      status: 'open',
    })
    .select(ticketSelect)
    .single<TicketRow>()

  if (insertError) {
    if (isUniqueViolation(insertError)) {
      const { data: racedTicket, error: racedLookupError } = await findExistingTicket()
      if (racedLookupError) throw racedLookupError
      if (racedTicket) return toTicket(racedTicket, user)
    }

    throw insertError
  }

  return toTicket(ticket, user)
}

async function findAuthUserByEmail(email: string) {
  const supabase = createAdminClient()
  const normalizedEmail = email.trim().toLowerCase()
  let page = 1

  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error

    const user = data.users.find((item) => item.email?.toLowerCase() === normalizedEmail)
    if (user) return user
    if (data.users.length < 1000) break
    page += 1
  }

  return null
}

export async function getOrCreateSupportTicketForAdmin(customerEmail: string) {
  const user = await findAuthUserByEmail(customerEmail)
  if (!user) throw new Error('Customer not found.')
  const customerUser = user

  const supabase = createAdminClient()

  async function findExistingTicket() {
    return supabase
      .from('support_tickets')
      .select(ticketSelect)
      .eq('user_id', customerUser.id)
      .is('order_id', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle<TicketRow>()
  }

  const { data: existing, error: existingError } = await findExistingTicket()
  if (existingError) throw existingError
  if (existing) return toTicket(existing, customerUser)

  const { data: ticket, error: insertError } = await supabase
    .from('support_tickets')
    .insert({
      user_id: customerUser.id,
      subject: 'General Support',
      status: 'open',
    })
    .select(ticketSelect)
    .single<TicketRow>()

  if (insertError) {
    if (isUniqueViolation(insertError)) {
      const { data: racedTicket, error: racedLookupError } = await findExistingTicket()
      if (racedLookupError) throw racedLookupError
      if (racedTicket) return toTicket(racedTicket, customerUser)
    }

    throw insertError
  }

  return toTicket(ticket, customerUser)
}

export async function getOrCreateAnonymousTicket() {
  const supabase = createAdminClient()
  const sessionId = await getOrCreateChatSessionId()

  async function findExistingTicket() {
    return supabase
      .from('support_tickets')
      .select(ticketSelect)
      .eq('session_id', sessionId)
      .is('user_id', null)
      .is('order_id', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle<TicketRow>()
  }

  const { data: existing, error: existingError } = await findExistingTicket()

  if (existingError) throw existingError
  if (existing) return toTicket(existing, null)

  const { data: ticket, error: insertError } = await supabase
    .from('support_tickets')
    .insert({
      session_id: sessionId,
      subject: 'General Support',
      status: 'open',
    })
    .select(ticketSelect)
    .single<TicketRow>()

  if (insertError) {
    if (isUniqueViolation(insertError)) {
      const { data: racedTicket, error: racedLookupError } = await findExistingTicket()
      if (racedLookupError) throw racedLookupError
      if (racedTicket) return toTicket(racedTicket, null)
    }

    throw insertError
  }

  return toTicket(ticket, null)
}

export async function getTicketForAnonymous(ticketId: string) {
  const sessionId = await getCurrentChatSessionId()
  if (!sessionId) return null

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('support_tickets')
    .select(ticketSelect)
    .eq('id', ticketId)
    .eq('session_id', sessionId)
    .maybeSingle<TicketRow>()

  if (error) throw error
  if (data) await refreshCurrentChatSession()
  return data
}

export async function cleanupExpiredAnonymousChatTickets(maxAgeSeconds = CHAT_COOKIE_MAX_AGE) {
  const supabase = createAdminClient()
  const expiresBefore = new Date(Date.now() - maxAgeSeconds * 1000).toISOString()

  const { data: expiredTickets, error: lookupError } = await supabase
    .from('support_tickets')
    .select('id')
    .is('user_id', null)
    .not('session_id', 'is', null)
    .lt('updated_at', expiresBefore)

  if (lookupError) throw lookupError

  const ticketIds = (expiredTickets ?? []).map((ticket) => ticket.id as string)
  if (ticketIds.length === 0) {
    return { deletedCount: 0, expiresBefore }
  }

  const { error: deleteError } = await supabase
    .from('support_tickets')
    .delete()
    .in('id', ticketIds)

  if (deleteError) throw deleteError

  return { deletedCount: ticketIds.length, expiresBefore }
}

function latestTimestamp(...values: Array<string | null | undefined>) {
  const timestamps = values
    .filter((value): value is string => Boolean(value))
    .map((value) => {
      const timestamp = new Date(value).getTime()
      return Number.isNaN(timestamp) ? 0 : timestamp
    })

  return timestamps.length > 0 ? Math.max(...timestamps) : 0
}

async function deleteTicketsByIds(ticketIds: string[]) {
  if (ticketIds.length === 0) return 0

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('support_tickets')
    .delete()
    .in('id', ticketIds)

  if (error) throw error
  return ticketIds.length
}

export async function cleanupExpiredChatTickets({
  anonymousMaxAgeSeconds = CHAT_COOKIE_MAX_AGE,
  loggedInSupportRetentionDays = LOGGED_IN_SUPPORT_CHAT_RETENTION_DAYS,
  orderChatRetentionDays = ORDER_CHAT_RETENTION_DAYS,
} = {}) {
  const supabase = createAdminClient()
  const now = Date.now()
  const anonymousExpiresBefore = new Date(now - anonymousMaxAgeSeconds * 1000).toISOString()
  const loggedInSupportExpiresBefore = new Date(now - loggedInSupportRetentionDays * DAY_MS).toISOString()
  const orderChatExpiresBeforeMs = now - orderChatRetentionDays * DAY_MS

  const { data: ticketRows, error: lookupError } = await supabase
    .from('support_tickets')
    .select('id, order_id, user_id, session_id, updated_at, orders(status, completed_at, updated_at)')

  if (lookupError) throw lookupError

  const expiredAnonymous: string[] = []
  const expiredLoggedInSupport: string[] = []
  const expiredOrderChats: string[] = []

  for (const ticket of (ticketRows ?? []) as RetentionTicketRow[]) {
    if (!ticket.user_id && ticket.session_id && !ticket.order_id && ticket.updated_at < anonymousExpiresBefore) {
      expiredAnonymous.push(ticket.id)
      continue
    }

    if (ticket.user_id && !ticket.order_id && ticket.updated_at < loggedInSupportExpiresBefore) {
      expiredLoggedInSupport.push(ticket.id)
      continue
    }

    const order = relationOne(ticket.orders)
    if (!ticket.order_id || !order || !['completed', 'refunded'].includes(order.status)) continue

    const lastImportantActivity = latestTimestamp(ticket.updated_at, order.completed_at, order.updated_at)
    if (lastImportantActivity > 0 && lastImportantActivity < orderChatExpiresBeforeMs) {
      expiredOrderChats.push(ticket.id)
    }
  }

  const deletedCount = await deleteTicketsByIds([...expiredAnonymous, ...expiredLoggedInSupport, ...expiredOrderChats])

  return {
    deletedCount,
    anonymousDeletedCount: expiredAnonymous.length,
    loggedInSupportDeletedCount: expiredLoggedInSupport.length,
    orderChatDeletedCount: expiredOrderChats.length,
    anonymousExpiresBefore,
    loggedInSupportExpiresBefore,
    orderChatExpiresBefore: new Date(orderChatExpiresBeforeMs).toISOString(),
    retention: {
      anonymousMaxAgeSeconds,
      loggedInSupportRetentionDays,
      orderChatRetentionDays,
    },
  }
}

export async function mergeAnonymousChatTickets(userId: string) {
  const sessionId = await getCurrentChatSessionId()
  if (!sessionId) return

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('support_tickets')
    .update({
      user_id: userId,
      session_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('session_id', sessionId)
    .is('user_id', null)

  if (error) throw error
  await clearChatSessionCookie()
}

export async function listCustomerTickets(user: User) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('support_tickets')
    .select(ticketSelect)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) throw error

  const rows = (data ?? []) as TicketRow[]
  const latest = await latestMessagesForTickets(rows.map((row) => row.id))
  const unread = await unreadAdminMessagesForTickets(rows)
  return uniqueLogicalTickets(rows.map((row) => toTicket(row, user, latest.get(row.id), unread.get(row.id) ?? 0)))
}

export async function listAnonymousTickets() {
  const sessionId = await getCurrentChatSessionId()
  if (!sessionId) return []

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('support_tickets')
    .select(ticketSelect)
    .eq('session_id', sessionId)
    .is('user_id', null)
    .order('updated_at', { ascending: false })

  if (error) throw error

  const rows = (data ?? []) as TicketRow[]
  const latest = await latestMessagesForTickets(rows.map((row) => row.id))
  const unread = await unreadAdminMessagesForTickets(rows)
  return uniqueLogicalTickets(rows.map((row) => toTicket(row, null, latest.get(row.id), unread.get(row.id) ?? 0)))
}

export async function listAdminTickets() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('support_tickets')
    .select(ticketSelect)
    .order('updated_at', { ascending: false })
    .limit(100)

  if (error) throw error

  const rows = (data ?? []) as TicketRow[]
  const users = await userMapForTickets(rows.map((row) => row.user_id).filter((id): id is string => Boolean(id)))
  const latest = await latestMessagesForTickets(rows.map((row) => row.id))
  const unread = await unreadCustomerMessagesForTickets(rows)
  return uniqueLogicalTickets(
    rows.map((row) => toTicket(row, row.user_id ? users.get(row.user_id) : null, latest.get(row.id), unread.get(row.id) ?? 0)),
  )
}

export async function getAdminUnreadTicketCount() {
  const tickets = await listAdminTickets()
  return tickets.filter((ticket) => ticket.unreadCount > 0).length
}

export async function getCustomerUnreadTicketCount(user: User | null) {
  const summary = await getCustomerUnreadSummary(user)
  return summary.unreadTicketCount
}

export async function getCustomerUnreadSummary(user: User | null) {
  const tickets = user ? await listCustomerTickets(user) : await listAnonymousTickets()
  return {
    unreadTicketCount: tickets.filter((ticket) => ticket.unreadCount > 0).length,
    unreadMessageCount: tickets.reduce((total, ticket) => total + ticket.unreadCount, 0),
  }
}

export async function markAdminTicketRead(ticketId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('support_tickets')
    .update({ admin_last_read_at: new Date().toISOString() })
    .eq('id', ticketId)
    .select('id')
    .maybeSingle<{ id: string }>()

  if (error) throw error
  return Boolean(data)
}

export async function markCustomerTicketRead(ticketId: string, userId: string | null) {
  const supabase = createAdminClient()
  let query = supabase
    .from('support_tickets')
    .update({ customer_last_read_at: new Date().toISOString() })
    .eq('id', ticketId)

  if (userId) {
    query = query.eq('user_id', userId)
  } else {
    const sessionId = await getCurrentChatSessionId()
    if (!sessionId) return false
    query = query.eq('session_id', sessionId).is('user_id', null)
  }

  const { data, error } = await query.select('id').maybeSingle<{ id: string }>()

  if (error) throw error
  return Boolean(data)
}

export async function getTicketForCustomer(ticketId: string, userId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('support_tickets')
    .select(ticketSelect)
    .eq('id', ticketId)
    .eq('user_id', userId)
    .maybeSingle<TicketRow>()

  if (error) throw error
  return data
}

export async function listMessages(ticketId: string, options: { limit?: number; before?: string | null } = {}): Promise<ChatMessagePage> {
  const limit = Math.min(Math.max(options.limit ?? 10, 1), 50)
  const supabase = createAdminClient()

  let query = supabase
    .from('messages')
    .select('id, ticket_id, sender_id, sender_role, content, attachments, sent_at')
    .eq('ticket_id', ticketId)
    .order('sent_at', { ascending: false })
    .limit(limit + 1)

  if (options.before) {
    query = query.lt('sent_at', options.before)
  }

  const { data, error } = await query

  if (error) throw error

  const rows = (data ?? []) as MessageRow[]
  const pageRows = rows.slice(0, limit)

  return {
    messages: pageRows.reverse().map(toMessage),
    hasMore: rows.length > limit,
  }
}

export async function sendChatMessage({
  ticketId,
  senderId,
  senderRole,
  content,
  attachments = [],
}: {
  ticketId: string
  senderId: string
  senderRole: ChatSenderRole
  content: string
  attachments?: ChatAttachment[]
}) {
  const trimmed = content.trim()
  if (trimmed.length < 1 && attachments.length === 0) throw new Error('Message cannot be empty.')
  if (trimmed.length > 2000) throw new Error('Message is too long.')

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('messages')
    .insert({
      ticket_id: ticketId,
      sender_id: senderId,
      sender_role: senderRole,
      content: trimmed,
      attachments,
    })
    .select('id, ticket_id, sender_id, sender_role, content, attachments, sent_at')
    .single<MessageRow>()

  if (error) throw error

  await supabase
    .from('support_tickets')
    .update({
      updated_at: new Date().toISOString(),
    })
    .eq('id', ticketId)

  return toMessage(data)
}
