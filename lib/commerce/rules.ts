import { createHash } from "node:crypto";

export const FREE_SHIPPING_THRESHOLD_PAISE = 99900; // ₹999
export const STANDARD_SHIPPING_PAISE = 7900;        // ₹79
export const GST_RATE = 0.18;                       // 18% inclusive

/**
 * Validates Indian 6-digit postal PIN codes:
 * - Must be exactly 6 numeric digits
 * - Leading digit must be 1-9 (Indian postal zones are 1-9, no 0-leading PIN codes)
 */
export function isPincodeServiceable(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
}

/**
 * Computes standard delivery charge based on order subtotal:
 * - Free for subtotal >= ₹999 (99,900 paise)
 * - ₹79 (7,900 paise) otherwise
 */
export function calculateShippingFee(subtotalMinor: number): number {
  return subtotalMinor >= FREE_SHIPPING_THRESHOLD_PAISE ? 0 : STANDARD_SHIPPING_PAISE;
}

/**
 * Calculates 18% inclusive GST component from gross selling price.
 * Statutory formula: Tax = Gross * (0.18 / 1.18) rounded deterministically.
 */
export function calculateInclusiveGst(subtotalMinor: number): number {
  return Math.round(subtotalMinor * (GST_RATE / (1 + GST_RATE)));
}

/**
 * Computes sellable units available from on-hand minus active reservations.
 * Always clamped at 0.
 */
export function calculateAvailableStock(onHand: number, reserved: number): number {
  return Math.max(0, onHand - reserved);
}

/**
 * Deterministic SHA-256 hash for guest cart tracking tokens.
 */
export function hashGuestToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
