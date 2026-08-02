import type { User } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserDisplayName, getUserInitials } from '@/lib/auth/user-display'

export const CHAT_COOKIE = 'ms_chat_session'
const CHAT_COOKIE_MAX_AGE = 60 * 60
const LOGGED_IN_SUPPORT_CHAT_RETENTION_DAYS = 90
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
  adminLastReadAt: string | null
  customerLastReadAt: string | null
}

export type ChatMessage = {
  id: string
  ticketId: string
  senderId: string
  senderRole: ChatSenderRole
  content: string
  attachments: ChatAttachment[]
  sentAt: string
  replyToId: string | null
  replyToContent: string | null
  replyToSenderRole: ChatSenderRole | null
}

export type ChatMessagePage = {
  messages: ChatMessage[]
  hasMore: boolean
}

type TicketRow = {
  id: string
  user_id: string | null
  session_id?: string | null
  subject: string
  status: ChatTicketStatus
  created_at: string
  updated_at: string
  admin_last_read_at?: string
  customer_last_read_at?: string
}

type RetentionTicketRow = {
  id: string
  user_id: string | null
  session_id: string | null
  updated_at: string
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
  reply_to_id: string | null
  reply_to?: {
    content: string
    sender_role: ChatSenderRole
  } | null
}

const ticketSelect =
  'id, user_id, session_id, subject, status, created_at, updated_at, admin_last_read_at, customer_last_read_at'

const messageSelect =
  'id, ticket_id, sender_id, sender_role, content, attachments, sent_at, reply_to_id, reply_to:reply_to_id(content, sender_role)'

function relationOne<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function toMessage(row: MessageRow): ChatMessage {
  const replyTo = relationOne(row.reply_to)
  return {
    id: row.id,
    ticketId: row.ticket_id,
    senderId: row.sender_id,
    senderRole: row.sender_role,
    content: row.content,
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    sentAt: row.sent_at,
    replyToId: row.reply_to_id ?? null,
    replyToContent: replyTo?.content ?? null,
    replyToSenderRole: replyTo?.sender_role ?? null,
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
  const customer = userLabel(user, row.user_id ? 'Customer' : 'Guest')

  return {
    id: row.id,
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
    adminLastReadAt: row.admin_last_read_at ?? null,
    customerLastReadAt: row.customer_last_read_at ?? null,
  }
}

function ticketSortTime(ticket: ChatTicket) {
  return ticket.latestMessageAt ?? ticket.createdAt
}

function sortTicketsByLatestActivity(tickets: ChatTicket[]) {
  return tickets.sort((a, b) => ticketSortTime(b).localeCompare(ticketSortTime(a)))
}

function isUniqueViolation(error: { code?: string }) {
  return error.code === '23505'
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

async function getCookieStore(): Promise<CookieStore> {
  return await cookies()
}

export async function getCurrentChatSessionId(): Promise<string | null> {
  const store = await getCookieStore()
  return store.get(CHAT_COOKIE)?.value ?? null
}

async function getOrCreateChatSessionId(): Promise<string> {
  const store = await getCookieStore()
  const existing = store.get(CHAT_COOKIE)?.value
  if (existing) return existing

  const sessionId = randomUUID()
  store.set(CHAT_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: CHAT_COOKIE_MAX_AGE,
  })
  return sessionId
}

async function refreshCurrentChatSession() {
  const store = await getCookieStore()
  const existing = store.get(CHAT_COOKIE)?.value
  if (!existing) return

  store.set(CHAT_COOKIE, existing, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: CHAT_COOKIE_MAX_AGE,
  })
}

async function clearChatSessionCookie() {
  const store = await getCookieStore()
  store.delete(CHAT_COOKIE)
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function latestMessagesForTickets(ticketIds: string[]) {
  if (ticketIds.length === 0) return new Map<string, MessageRow>()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('messages')
    .select('ticket_id, content, sent_at')
    .in('ticket_id', ticketIds)
    .order('sent_at', { ascending: false })

  if (error) throw error

  const latest = new Map<string, MessageRow>()
  for (const row of (data ?? []) as (MessageRow & { ticket_id: string })[]) {
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

async function userMapForTickets(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, User>()

  const supabase = createAdminClient()
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) throw error

  const map = new Map<string, User>()
  for (const user of data.users) {
    if (userIds.includes(user.id)) map.set(user.id, user as User)
  }
  return map
}

// ─── Customer ticket ──────────────────────────────────────────────────────────

export async function getOrCreateCustomerTicket(user: User) {
  const supabase = createAdminClient()

  async function findExistingTicket() {
    return supabase
      .from('support_tickets')
      .select(ticketSelect)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle<TicketRow>()
  }

  const { data: existing, error: existingError } = await findExistingTicket()
  if (existingError) throw existingError
  if (existing) return toTicket(existing, user)

  const { data: ticket, error: insertError } = await supabase
    .from('support_tickets')
    .insert({
      user_id: user.id,
      subject: 'Support',
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

// ─── Anonymous ticket ─────────────────────────────────────────────────────────

export async function getOrCreateAnonymousTicket() {
  const supabase = createAdminClient()
  const sessionId = await getOrCreateChatSessionId()

  async function findExistingTicket() {
    return supabase
      .from('support_tickets')
      .select(ticketSelect)
      .eq('session_id', sessionId)
      .is('user_id', null)
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
      subject: 'Support',
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

// ─── Cleanup ──────────────────────────────────────────────────────────────────

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
} = {}) {
  const supabase = createAdminClient()
  const now = Date.now()
  const anonymousExpiresBefore = new Date(now - anonymousMaxAgeSeconds * 1000).toISOString()
  const loggedInSupportExpiresBefore = new Date(now - loggedInSupportRetentionDays * DAY_MS).toISOString()

  const { data: ticketRows, error: lookupError } = await supabase
    .from('support_tickets')
    .select('id, user_id, session_id, updated_at')

  if (lookupError) throw lookupError

  const expiredAnonymous: string[] = []
  const expiredLoggedInSupport: string[] = []

  for (const ticket of (ticketRows ?? []) as RetentionTicketRow[]) {
    if (!ticket.user_id && ticket.session_id && ticket.updated_at < anonymousExpiresBefore) {
      expiredAnonymous.push(ticket.id)
      continue
    }

    if (ticket.user_id && ticket.updated_at < loggedInSupportExpiresBefore) {
      expiredLoggedInSupport.push(ticket.id)
    }
  }

  const deletedCount = await deleteTicketsByIds([...expiredAnonymous, ...expiredLoggedInSupport])

  return {
    deletedCount,
    anonymousDeletedCount: expiredAnonymous.length,
    loggedInSupportDeletedCount: expiredLoggedInSupport.length,
    anonymousExpiresBefore,
    loggedInSupportExpiresBefore,
    retention: {
      anonymousMaxAgeSeconds,
      loggedInSupportRetentionDays,
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

// ─── List tickets ─────────────────────────────────────────────────────────────

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
  return rows.map((row) => toTicket(row, user, latest.get(row.id), unread.get(row.id) ?? 0))
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
  return rows.map((row) => toTicket(row, null, latest.get(row.id), unread.get(row.id) ?? 0))
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
  return rows.map((row) => toTicket(row, row.user_id ? users.get(row.user_id) : null, latest.get(row.id), unread.get(row.id) ?? 0))
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

// ─── Mark read ────────────────────────────────────────────────────────────────

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

// ─── Get ticket ───────────────────────────────────────────────────────────────

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

// ─── Messages ─────────────────────────────────────────────────────────────────

// ─── Deleted-game scrubbing ───────────────────────────────────────────────────

/**
 * Extract a game slug from a chat link-attachment href.
 * Hrefs are stored as absolute paths like "/{game-slug}" or
 * "/{game-slug}/{category-slug}/{service-slug}".
 */
function gameSlugFromHref(href: string): string | null {
  try {
    const pathname = href.startsWith('http') ? new URL(href).pathname : href
    const slug = pathname.split('/').filter(Boolean)[0]
    return slug ?? null
  } catch {
    return null
  }
}

const GAME_DELETED_SENTINEL: Extract<ChatAttachment, { type: 'link' }> = {
  type: 'link',
  linkType: 'game',
  title: 'game no longer exist',
  href: '#',
  image: undefined,
  meta: undefined,
}

/**
 * For a batch of messages, find every link attachment that references a game
 * slug, bulk-query the games table to check which slugs still exist, and
 * replace stale attachments with the sentinel so the UI shows
 * "game no longer exist".
 */
async function scrubDeletedGameAttachments(messages: ChatMessage[]): Promise<ChatMessage[]> {
  // Collect all unique game slugs referenced by link attachments
  const slugSet = new Set<string>()
  for (const msg of messages) {
    for (const att of msg.attachments) {
      if (att.type === 'link') {
        const slug = gameSlugFromHref(att.href)
        if (slug) slugSet.add(slug)
      }
    }
  }

  if (slugSet.size === 0) return messages

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('games')
    .select('slug')
    .in('slug', Array.from(slugSet))

  const existingSlugs = new Set((data ?? []).map((r: { slug: string }) => r.slug))

  return messages.map((msg) => {
    const patchedAttachments = msg.attachments.map((att) => {
      if (att.type !== 'link') return att
      const slug = gameSlugFromHref(att.href)
      if (slug && !existingSlugs.has(slug)) return GAME_DELETED_SENTINEL
      return att
    })
    if (patchedAttachments === msg.attachments) return msg
    return { ...msg, attachments: patchedAttachments }
  })
}

export async function listMessages(ticketId: string, options: { limit?: number; before?: string | null } = {}): Promise<ChatMessagePage> {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 50)
  const supabase = createAdminClient()

  let query = supabase
    .from('messages')
    .select(messageSelect)
    .eq('ticket_id', ticketId)
    .order('sent_at', { ascending: false })
    .limit(limit + 1)

  if (options.before) {
    query = query.lt('sent_at', options.before)
  }

  const { data, error } = await query

  if (error) throw error

  const rows = (data ?? []) as unknown as MessageRow[]
  const pageRows = rows.slice(0, limit)
  const messages = await scrubDeletedGameAttachments(pageRows.reverse().map(toMessage))

  return {
    messages,
    hasMore: rows.length > limit,
  }
}

export async function sendChatMessage({
  ticketId,
  senderId,
  senderRole,
  content,
  attachments = [],
  replyToId,
}: {
  ticketId: string
  senderId: string
  senderRole: ChatSenderRole
  content: string
  attachments?: ChatAttachment[]
  replyToId?: string | null
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
      reply_to_id: replyToId ?? null,
    })
    .select(messageSelect)
    .single<MessageRow>()

  if (error) throw error

  await supabase
    .from('support_tickets')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', ticketId)

  return toMessage(data)
}
