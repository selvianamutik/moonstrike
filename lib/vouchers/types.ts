/**
 * TypeScript types for the voucher discount system.
 * Provides type definitions for voucher data, validation, and admin operations.
 */

import type { Currency } from '@/lib/cart'

/**
 * Base voucher record from the database.
 */
export interface Voucher {
  /** Unique identifier */
  id: string
  /** Unique voucher code (case-insensitive) */
  code: string
  /** Discount percentage (0-100) */
  discountPercentage: number
  /** Expiration timestamp (ISO 8601) */
  expiresAt: string
  /** ID of the admin user who created the voucher */
  createdBy: string
  /** Creation timestamp (ISO 8601) */
  createdAt: string
  /** Last update timestamp (ISO 8601) */
  updatedAt: string
}

/**
 * Voucher with computed status based on expiration.
 */
export interface VoucherWithStatus extends Voucher {
  /** Current status based on expiration date */
  status: 'active' | 'expired'
}

/**
 * Input type for creating a new voucher.
 * Does not include system-generated fields like id, createdBy, createdAt, updatedAt.
 */
export interface CreateVoucherInput {
  /** Unique voucher code */
  code: string
  /** Discount percentage (0-100) */
  discountPercentage: number
  /** Expiration timestamp (ISO 8601) */
  expiresAt: string
}

/**
 * Input type for updating an existing voucher.
 * Code is immutable - only discountPercentage and expiresAt can be updated.
 */
export interface UpdateVoucherInput {
  /** Discount percentage (0-100) */
  discountPercentage: number
  /** Expiration timestamp (ISO 8601) */
  expiresAt: string
}

/**
 * Response from the voucher validation API.
 */
export interface ValidateVoucherResponse {
  /** The validated voucher code */
  code: string
  /** The discount percentage */
  discountPercentage: number
}

/**
 * Voucher applied to a cart/checkout session.
 * Lightweight representation for client-side state.
 */
export interface AppliedVoucher {
  /** The applied voucher code */
  code: string
  /** The discount percentage */
  discountPercentage: number
}

/**
 * Price breakdown with voucher discount applied.
 */
export interface PriceBreakdown {
  /** Original subtotal before discount */
  subtotal: number
  /** Discount amount */
  discount: number
  /** Final total after discount */
  total: number
  /** Currency for the amounts */
  currency: Currency
  /** Applied voucher code (if any) */
  voucherCode?: string
  /** Applied discount percentage (if any) */
  discountPercentage?: number
}

/**
 * Error response from voucher validation API.
 */
export type VoucherValidationError =
  | 'Voucher code not found'
  | 'Voucher has expired'
  | 'Invalid voucher code'

/**
 * Request body for voucher validation endpoint.
 */
export interface ValidateVoucherRequest {
  /** Voucher code to validate (case-insensitive) */
  code: string
}