/**
 * Discount calculator utility for voucher discount system.
 * Provides functions to calculate discount amounts and price breakdowns.
 */

import type { Currency } from '@/lib/cart'
import type { PriceBreakdown } from './types'

/**
 * Calculates the discount amount based on subtotal and discount percentage.
 * Formula: subtotal × (discountPercentage ÷ 100), rounded to 2 decimal places
 * 
 * @param subtotal - The cart subtotal amount
 * @param discountPercentage - The discount percentage (0-100)
 * @returns The discount amount rounded to 2 decimal places
 */
export function calculateDiscount(
  subtotal: number,
  discountPercentage: number
): number {
  if (subtotal < 0 || !Number.isFinite(subtotal)) {
    return 0
  }
  
  if (discountPercentage < 0 || discountPercentage > 100 || !Number.isFinite(discountPercentage)) {
    return 0
  }
  
  const discount = subtotal * (discountPercentage / 100)
  return Math.round(discount * 100) / 100
}

/**
 * Calculates the final total after applying a discount.
 * Formula: subtotal - discount, rounded to 2 decimal places
 * 
 * @param subtotal - The cart subtotal amount
 * @param discountPercentage - The discount percentage (0-100)
 * @returns The final total after discount rounded to 2 decimal places
 */
export function calculateTotal(
  subtotal: number,
  discountPercentage: number
): number {
  const discount = calculateDiscount(subtotal, discountPercentage)
  const total = subtotal - discount
  return Math.round(total * 100) / 100
}

/**
 * Computes a complete price breakdown with all components.
 * Handles both USD and EUR currencies independently.
 * 
 * @param subtotal - The cart subtotal amount
 * @param currency - The currency to use (USD or EUR)
 * @param voucher - Optional voucher data to apply
 * @returns A complete PriceBreakdown object with all price components
 */
export function computePriceBreakdown(
  subtotal: number,
  currency: Currency,
  voucher?: { code: string; discountPercentage: number }
): PriceBreakdown {
  if (subtotal < 0 || !Number.isFinite(subtotal)) {
    subtotal = 0
  }
  
  let discount = 0
  let voucherCode: string | undefined
  let discountPercentage: number | undefined
  
  if (voucher) {
    voucherCode = voucher.code
    discountPercentage = voucher.discountPercentage
    discount = calculateDiscount(subtotal, voucher.discountPercentage)
  }
  
  const total = Math.round((subtotal - discount) * 100) / 100
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount,
    total,
    currency,
    voucherCode,
    discountPercentage,
  }
}

/**
 * Calculates the combined discount for multiple vouchers applied sequentially.
 * Each voucher's discount is capped by the remaining subtotal.
 * 
 * @param subtotal - The cart subtotal amount
 * @param vouchers - Array of applied vouchers
 * @returns The total discount amount rounded to 2 decimal places
 */
export function calculateTotalDiscount(
  subtotal: number,
  vouchers: Array<{ code: string; discountPercentage: number }>
): number {
  if (subtotal < 0 || !Number.isFinite(subtotal)) return 0
  if (!vouchers || vouchers.length === 0) return 0

  let remaining = subtotal
  let totalDiscount = 0

  for (const voucher of vouchers) {
    if (remaining <= 0) break
    if (voucher.discountPercentage < 0 || voucher.discountPercentage > 100 || !Number.isFinite(voucher.discountPercentage)) {
      continue
    }
    const discount = Math.min(remaining * (voucher.discountPercentage / 100), remaining)
    totalDiscount += discount
    remaining -= discount
  }

  return Math.round(totalDiscount * 100) / 100
}