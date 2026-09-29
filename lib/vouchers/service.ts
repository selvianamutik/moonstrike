import { createAdminClient } from '@/lib/supabase/admin'
import type { CreateVoucherInput, UpdateVoucherInput, Voucher, VoucherWithStatus } from './types'

type VoucherRow = {
  id: string
  code: string
  discount_percentage: number | string
  expires_at: string
  created_by: string
  created_at: string
  updated_at: string
}

const voucherSelect = 'id, code, discount_percentage, expires_at, created_by, created_at, updated_at'

export class VoucherServiceError extends Error {
  constructor(
    message: string,
    readonly code: 'invalid_input' | 'duplicate' | 'not_found' | 'expired'
  ) {
    super(message)
    this.name = 'VoucherServiceError'
  }
}

export function computeVoucherStatus(expiresAt: string, now = new Date()) {
  return new Date(expiresAt).getTime() > now.getTime() ? 'active' as const : 'expired' as const
}

function normalizeCode(value: unknown) {
  return typeof value === 'string' ? value.trim().toUpperCase() : ''
}

function normalizeExpiration(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new VoucherServiceError('Expiration date is required.', 'invalid_input')
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new VoucherServiceError('Expiration date is invalid.', 'invalid_input')
  }

  if (date.getTime() <= Date.now()) {
    throw new VoucherServiceError('Expiration date must be in the future.', 'invalid_input')
  }

  return date.toISOString()
}

function validateDiscount(value: unknown) {
  const discount = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
    throw new VoucherServiceError('Discount percentage must be between 0 and 100.', 'invalid_input')
  }

  return discount
}

function validateCode(value: unknown) {
  const code = normalizeCode(value)

  if (!code) {
    throw new VoucherServiceError('Voucher code is required.', 'invalid_input')
  }

  if (!/^[A-Z0-9]{1,64}$/.test(code)) {
    throw new VoucherServiceError('Voucher code must contain 1 to 64 letters or numbers.', 'invalid_input')
  }

  return code
}

function toVoucher(row: VoucherRow): Voucher {
  return {
    id: row.id,
    code: row.code,
    discountPercentage: Number(row.discount_percentage),
    expiresAt: row.expires_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function handleDatabaseError(error: { code?: string; message: string }): never {
  if (error.code === '23505') {
    throw new VoucherServiceError('Voucher code already exists.', 'duplicate')
  }

  throw new Error(error.message)
}

export async function listVouchers(): Promise<VoucherWithStatus[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('vouchers')
    .select(voucherSelect)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const now = new Date()
  return ((data ?? []) as VoucherRow[]).map((row) => ({
    ...toVoucher(row),
    status: computeVoucherStatus(row.expires_at, now)
  }))
}

export async function validateVoucherCode(codeValue: unknown, userId?: string | null) {
  const code = validateCode(codeValue)
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('vouchers')
    .select(voucherSelect)
    .eq('code', code)
    .maybeSingle<VoucherRow>()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new VoucherServiceError('Voucher code not found.', 'not_found')
  }

  const voucher = toVoucher(data)
  if (computeVoucherStatus(voucher.expiresAt) === 'expired') {
    throw new VoucherServiceError('Voucher has expired.', 'expired')
  }

  // Single-use per user: reject if this specific user has already redeemed it
  if (userId) {
    const { data: redemption, error: redemptionError } = await supabase
      .from('voucher_redemptions')
      .select('id')
      .eq('voucher_id', voucher.id)
      .eq('user_id', userId)
      .maybeSingle<{ id: string }>()

    if (redemptionError) {
      throw new Error(redemptionError.message)
    }

    if (redemption) {
      throw new VoucherServiceError('You have already used this voucher code.', 'invalid_input')
    }
  }

  return voucher
}

/**
 * Record a successful voucher redemption after payment is confirmed.
 * Idempotent: re-calling with the same checkout session is a no-op.
 */
export async function redeemVoucher(voucherId: string, userId: string, checkoutSessionId: string) {
  if (!voucherId || !userId || !checkoutSessionId) {
    throw new VoucherServiceError('Voucher redemption requires voucher id, user id, and checkout session id.', 'invalid_input')
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('voucher_redemptions').insert({
    voucher_id: voucherId,
    user_id: userId,
    checkout_session_id: checkoutSessionId,
  })

  if (error) {
    if (error.code === '23505') {
      // Already redeemed for this checkout session — idempotent no-op
      const { data: existing } = await supabase
        .from('voucher_redemptions')
        .select('id')
        .eq('voucher_id', voucherId)
        .eq('checkout_session_id', checkoutSessionId)
        .maybeSingle<{ id: string }>()

      if (existing) return
    }
    handleDatabaseError(error)
  }
}

export async function createVoucher(input: CreateVoucherInput, createdBy: string) {
  const code = validateCode(input.code)
  const discountPercentage = validateDiscount(input.discountPercentage)
  const expiresAt = normalizeExpiration(input.expiresAt)
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('vouchers')
    .insert({
      code,
      discount_percentage: discountPercentage,
      expires_at: expiresAt,
      created_by: createdBy
    })
    .select(voucherSelect)
    .single<VoucherRow>()

  if (error) {
    handleDatabaseError(error)
  }

  return toVoucher(data)
}

export async function updateVoucher(id: string, input: UpdateVoucherInput) {
  if (!id) {
    throw new VoucherServiceError('Voucher not found.', 'not_found')
  }

  const discountPercentage = validateDiscount(input.discountPercentage)
  const expiresAt = normalizeExpiration(input.expiresAt)
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('vouchers')
    .update({ discount_percentage: discountPercentage, expires_at: expiresAt })
    .eq('id', id)
    .select(voucherSelect)
    .maybeSingle<VoucherRow>()

  if (error) {
    handleDatabaseError(error)
  }

  if (!data) {
    throw new VoucherServiceError('Voucher not found.', 'not_found')
  }

  return toVoucher(data)
}

export async function deleteVoucher(id: string) {
  if (!id) {
    throw new VoucherServiceError('Voucher not found.', 'not_found')
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('vouchers')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle<{ id: string }>()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new VoucherServiceError('Voucher not found.', 'not_found')
  }
}

export function voucherErrorResponse(error: unknown) {
  if (error instanceof VoucherServiceError) {
    return {
      error: error.message,
      status: error.code === 'not_found' ? 404 : 400
    }
  }

  return {
    error: error instanceof Error ? error.message : 'Unexpected voucher service error.',
    status: 500
  }
}
