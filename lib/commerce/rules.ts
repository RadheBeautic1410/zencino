import { createHash, randomBytes } from "node:crypto";

export const FREE_SHIPPING_THRESHOLD_PAISE = 99_900; // ₹999
export const STANDARD_SHIPPING_PAISE = 7900; // ₹79
export const GST_RATE = 0.18; // 18% inclusive
/** Per-kg charge used when no active shipping rate matches the PIN code. */
export const DEFAULT_SHIPPING_RATE_PER_KG_PAISE = 6000; // ₹60 / kg
/** Weight assumed for a variant that has no weight recorded. */
export const DEFAULT_ITEM_WEIGHT_G = 300;

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
  return subtotalMinor >= FREE_SHIPPING_THRESHOLD_PAISE
    ? 0
    : STANDARD_SHIPPING_PAISE;
}

export type ShippingPincodeType = "exact" | "range" | "wildcard";

export interface ShippingRateRule {
  pincode: string;
  /** Charge per started kilogram, in paise. */
  rateMinor: number;
  type: ShippingPincodeType;
}

/** Keeps digits only and trims to 6 characters. */
export function normalizePincode(pincode: string): string {
  return pincode.replace(/\D/g, "").slice(0, 6);
}

export function determineShippingPincodeType(
  pattern: string
): ShippingPincodeType {
  if (pattern.includes("*")) {
    return "wildcard";
  }
  if (pattern.includes("-")) {
    return "range";
  }
  return "exact";
}

/** Validates an admin-entered pattern: `364001`, `364001-364005` or `36*`. */
export function validateShippingPincodePattern(
  pattern: string
): { ok: true; type: ShippingPincodeType } | { ok: false; error: string } {
  const value = pattern.trim();
  const type = determineShippingPincodeType(value);

  if (type === "wildcard") {
    if (!/^\d{1,5}\*+$/.test(value) || value.length > 6) {
      return {
        ok: false,
        error: "Wildcard is a 1-5 digit prefix then *, e.g. 36* or 3640**.",
      };
    }
  } else if (type === "range") {
    const parts = value.split("-");
    if (
      parts.length !== 2 ||
      !/^\d{6}$/.test(parts[0]) ||
      !/^\d{6}$/.test(parts[1])
    ) {
      return {
        ok: false,
        error: "Range must be two 6-digit PIN codes, e.g. 364001-364005.",
      };
    }
    if (Number(parts[0]) >= Number(parts[1])) {
      return { ok: false, error: "Range start must be less than range end." };
    }
  } else if (!/^\d{6}$/.test(value)) {
    return { ok: false, error: "PIN code must be exactly 6 digits." };
  }

  return { ok: true, type };
}

export function matchesShippingPincode(
  pincode: string,
  rule: Pick<ShippingRateRule, "pincode" | "type">
): boolean {
  if (rule.type === "exact") {
    return pincode === rule.pincode;
  }
  if (rule.type === "wildcard") {
    return pincode.startsWith(rule.pincode.replace(/\*/g, ""));
  }
  const [start, end] = rule.pincode.split("-").map(Number);
  const value = Number(pincode);
  return value >= start && value <= end;
}

/** Best matching rate: exact, then range, then the longest wildcard prefix. */
export function findShippingRate<T extends ShippingRateRule>(
  rates: T[],
  pincode: string
): T | null {
  const normalized = normalizePincode(pincode);
  if (normalized.length !== 6) {
    return null;
  }
  const exact = rates.find(
    (r) => r.type === "exact" && matchesShippingPincode(normalized, r)
  );
  if (exact) {
    return exact;
  }
  // Overlapping ranges: the narrowest one is the most specific.
  const span = (r: T) => {
    const [start, end] = r.pincode.split("-").map(Number);
    return end - start;
  };
  const range = rates
    .filter((r) => r.type === "range" && matchesShippingPincode(normalized, r))
    .sort((a, b) => span(a) - span(b))[0];
  if (range) {
    return range;
  }
  const prefixLength = (r: T) => r.pincode.replace(/\*/g, "").length;
  const wildcards = rates
    .filter(
      (r) => r.type === "wildcard" && matchesShippingPincode(normalized, r)
    )
    .sort((a, b) => prefixLength(b) - prefixLength(a));
  return wildcards[0] ?? null;
}

/** Weight is billed in whole kilograms, rounded up, minimum 1 kg. */
export function billableWeightKg(totalWeightG: number): number {
  return Math.max(1, Math.ceil(totalWeightG / 1000));
}

export function totalCartWeightG(
  items: { quantity: number; weightG?: number | null }[]
): number {
  return items.reduce(
    (sum, item) => sum + (item.weightG || DEFAULT_ITEM_WEIGHT_G) * item.quantity,
    0
  );
}

export function calculateWeightShipping(
  totalWeightG: number,
  ratePerKgMinor: number
): number {
  return ratePerKgMinor * billableWeightKg(totalWeightG);
}

/**
 * Calculates 18% inclusive GST component from gross selling price.
 * Statutory formula: Tax = Gross * (0.18 / 1.18) rounded deterministically.
 */
export function calculateInclusiveGst(subtotalMinor: number): number {
  return Math.round(subtotalMinor * (GST_RATE / (1 + GST_RATE)));
}

export interface GstBreakdown {
  cgstMinor: number;
  igstMinor: number;
  isInterState: boolean;
  sgstMinor: number;
  taxableValueMinor: number;
  taxMinor: number;
}

/**
 * Computes statutory GST breakdown for Tax Invoices:
 * - If buyer state equals seller state (intra-state): split 50/50 into CGST 9% and SGST 9%
 * - If buyer state differs from seller state (inter-state): IGST 18%
 */
export function calculateGstBreakdown(
  grossTotalMinor: number,
  buyerState?: string | null,
  sellerState = "Maharashtra"
): GstBreakdown {
  const taxMinor = calculateInclusiveGst(grossTotalMinor);
  const taxableValueMinor = grossTotalMinor - taxMinor;

  const normalizedBuyer = (buyerState || "").trim().toLowerCase();
  const normalizedSeller = sellerState.trim().toLowerCase();
  const isInterState = Boolean(
    normalizedBuyer && normalizedBuyer !== normalizedSeller
  );

  if (isInterState) {
    return {
      taxableValueMinor,
      taxMinor,
      cgstMinor: 0,
      sgstMinor: 0,
      igstMinor: taxMinor,
      isInterState: true,
    };
  }

  // Intra-state split 50/50
  const halfTax = Math.floor(taxMinor / 2);
  const remainder = taxMinor - halfTax;
  return {
    taxableValueMinor,
    taxMinor,
    cgstMinor: halfTax,
    sgstMinor: remainder,
    igstMinor: 0,
    isInterState: false,
  };
}

/**
 * Converts a numerical rupee amount into Indian currency words for Tax Invoices.
 * Example: 1498 -> "One Thousand Four Hundred Ninety-Eight Rupees Only"
 */
export function numberToWordsRupees(rupees: number): string {
  if (!rupees || rupees <= 0) {
    return "Zero Rupees Only";
  }

  const num = Math.floor(rupees);
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertTwoDigits(n: number): string {
    if (n === 0) {
      return "";
    }
    if (n < 20) {
      return ones[n];
    }
    const t = Math.floor(n / 10);
    const u = n % 10;
    return u > 0 ? `${tens[t]}-${ones[u]}` : tens[t];
  }

  function convertThreeDigits(n: number): string {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    if (h > 0 && rest > 0) {
      return `${ones[h]} Hundred ${convertTwoDigits(rest)}`;
    }
    if (h > 0) {
      return `${ones[h]} Hundred`;
    }
    return convertTwoDigits(rest);
  }

  const crore = Math.floor(num / 10_000_000);
  const lakh = Math.floor((num % 10_000_000) / 100_000);
  const thousand = Math.floor((num % 100_000) / 1000);
  const remaining = num % 1000;

  const parts: string[] = [];

  if (crore > 0) {
    parts.push(`${convertThreeDigits(crore)} Crore`);
  }
  if (lakh > 0) {
    parts.push(`${convertThreeDigits(lakh)} Lakh`);
  }
  if (thousand > 0) {
    parts.push(`${convertThreeDigits(thousand)} Thousand`);
  }
  if (remaining > 0) {
    parts.push(convertThreeDigits(remaining));
  }

  return `${parts.join(" ")} Rupees Only`;
}

/**
 * Computes sellable units available from on-hand minus active reservations.
 * Always clamped at 0.
 */
export function calculateAvailableStock(
  onHand: number,
  reserved: number
): number {
  return Math.max(0, onHand - reserved);
}

/**
 * Deterministic SHA-256 hash for guest cart tracking tokens.
 */
export function hashGuestToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Generates an immutable, human-friendly order reference: ZNC-YYYYMMDD-XXXX
 * Example: ZNC-20260912-A3F9
 */
export function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = randomBytes(2).toString("hex").toUpperCase();
  return `ZNC-${dateStr}-${randomSuffix}`;
}

/**
 * Generates an immutable, human-friendly return reference: RET-YYYYMMDD-XXXX
 * Example: RET-20260912-B4E1
 */
export function generateReturnNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = randomBytes(2).toString("hex").toUpperCase();
  return `RET-${dateStr}-${randomSuffix}`;
}

/**
 * Generates an immutable, human-friendly refund reference: REF-YYYYMMDD-XXXX
 * Example: REF-20260912-C8D2
 */
export function generateRefundNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = randomBytes(2).toString("hex").toUpperCase();
  return `REF-${dateStr}-${randomSuffix}`;
}

/**
 * Generates an immutable, statutory GST Credit Note reference: CN-YYYYMMDD-XXXX
 * Compliant with Section 34 of CGST Act, 2017.
 * Example: CN-20260912-A1B2
 */
export function generateCreditNoteNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = randomBytes(2).toString("hex").toUpperCase();
  return `CN-${dateStr}-${randomSuffix}`;
}

export const RETURN_WINDOW_DAYS = 7;
const RETURN_WINDOW_MS = RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;

/**
 * Evaluates return eligibility under Zencino 7-day transit & quality policy:
 * - Order must be in 'delivered' status.
 * - Delivery date must be within 7 calendar days.
 */
export function isReturnEligible(
  orderStatus: string,
  deliveredAt?: Date | string | null
): { eligible: boolean; reason?: string } {
  if (orderStatus !== "delivered") {
    return {
      eligible: false,
      reason:
        "Returns are only applicable once the package has been delivered.",
    };
  }

  if (!deliveredAt) {
    // If delivery date is missing but status is delivered, permit claim within fallback window
    return { eligible: true };
  }

  const deliveryTime = new Date(deliveredAt).getTime();
  const now = Date.now();

  if (now - deliveryTime > RETURN_WINDOW_MS) {
    return {
      eligible: false,
      reason:
        "The 7-day replacement and return window has expired for this delivered order.",
    };
  }

  return { eligible: true };
}

export const ORDER_STATUSES = [
  "pending_payment",
  "payment_review",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

/**
 * Validates allowed state machine transitions for orders:
 * - Unpaid orders cannot be dispatched (shipped).
 * - Shipped/delivered orders cannot be directly cancelled.
 */
export function canTransitionOrderStatus(
  currentStatus: string,
  targetStatus: string,
  paymentStatus: string
): boolean {
  if (currentStatus === targetStatus) {
    return true;
  }

  // Terminal states
  if (currentStatus === "cancelled" || currentStatus === "delivered") {
    return false;
  }

  const validTransitions: Record<string, string[]> = {
    pending_payment: ["payment_review", "cancelled"],
    payment_review: ["confirmed", "cancelled", "pending_payment"],
    confirmed: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered"],
  };

  const allowed =
    validTransitions[currentStatus]?.includes(targetStatus) ?? false;
  if (!allowed) {
    return false;
  }

  // Invariant: cannot ship without verified payment
  if (targetStatus === "shipped" && paymentStatus !== "verified") {
    return false;
  }

  return true;
}

/**
 * Generates unique customer support ticket numbers: SUP-YYYYMMDD-XXXX
 */
export function generateSupportTicketNumber(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const entropy = Math.floor(Math.random() * 0xff_ff)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");
  return `SUP-${y}${m}${d}-${entropy}`;
}

/**
 * Builds clean UTM deep link URL for marketing campaigns
 */
export function buildCampaignUtmUrl(input: {
  landingPath: string;
  source: string;
  medium: string;
  campaign: string;
  content?: string | null;
  origin?: string;
}): string {
  const path = input.landingPath.startsWith("/")
    ? input.landingPath
    : `/${input.landingPath}`;
  const origin = input.origin || "https://zencino.com";
  const url = new URL(path, origin);

  url.searchParams.set("utm_source", input.source.trim().toLowerCase());
  url.searchParams.set("utm_medium", input.medium.trim().toLowerCase());
  url.searchParams.set("utm_campaign", input.campaign.trim().toLowerCase());
  if (input.content?.trim()) {
    url.searchParams.set("utm_content", input.content.trim().toLowerCase());
  }

  return url.toString();
}

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

export interface CouponRule {
  active: boolean;
  discountType: "percent" | "fixed";
  discountValue: number;
  expiresAt: Date | null;
  maxDiscountMinor: number | null;
  minOrderMinor: number;
  startsAt: Date | null;
}

export function normalizeCouponCode(code: string): string {
  return code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "");
}

/**
 * Evaluates a coupon against a cart subtotal. Returns the discount in paise
 * (never more than the subtotal) or a customer-facing rejection reason.
 */
export function evaluateCoupon(
  coupon: CouponRule,
  subtotalMinor: number,
  now: Date = new Date()
): { ok: true; discountMinor: number } | { ok: false; reason: string } {
  if (!coupon.active) {
    return { ok: false, reason: "This coupon is no longer active." };
  }
  if (coupon.startsAt && now < coupon.startsAt) {
    return { ok: false, reason: "This coupon is not valid yet." };
  }
  if (coupon.expiresAt && now > coupon.expiresAt) {
    return { ok: false, reason: "This coupon has expired." };
  }
  if (subtotalMinor < coupon.minOrderMinor) {
    return {
      ok: false,
      reason: `Add items worth ₹${(coupon.minOrderMinor / 100).toLocaleString("en-IN")} or more to use this coupon.`,
    };
  }

  let discountMinor =
    coupon.discountType === "percent"
      ? Math.floor((subtotalMinor * coupon.discountValue) / 100)
      : coupon.discountValue;

  if (coupon.maxDiscountMinor !== null) {
    discountMinor = Math.min(discountMinor, coupon.maxDiscountMinor);
  }
  discountMinor = Math.max(0, Math.min(discountMinor, subtotalMinor));

  if (discountMinor === 0) {
    return { ok: false, reason: "This coupon gives no discount on your bag." };
  }
  return { ok: true, discountMinor };
}

/**
 * Splits an order discount across the eligible lines proportionally to their
 * value (floored). The last eligible line absorbs the remainder. Returns one
 * share (paise) per input line; ineligible lines get 0.
 */
export function allocateDiscount(
  lines: { eligible: boolean; lineTotalMinor: number }[],
  discountMinor: number
): number[] {
  const eligibleTotal = lines.reduce(
    (sum, l) => (l.eligible ? sum + l.lineTotalMinor : sum),
    0
  );
  const lastEligible = lines.map((l) => l.eligible).lastIndexOf(true);
  if (discountMinor <= 0 || eligibleTotal <= 0 || lastEligible === -1) {
    return lines.map(() => 0);
  }

  let allocated = 0;
  return lines.map((line, index) => {
    if (!line.eligible) {
      return 0;
    }
    const share =
      index === lastEligible
        ? discountMinor - allocated
        : Math.floor((line.lineTotalMinor * discountMinor) / eligibleTotal);
    allocated += share;
    return share;
  });
}

export interface OrderTotals {
  discountMinor: number;
  shippingMinor: number;
  subtotalMinor: number;
  taxMinor: number;
  totalMinor: number;
}

/** Coupon applies to the subtotal; shipping and GST are computed on what remains. */
export function calculateOrderTotals(
  subtotalMinor: number,
  discountMinor = 0,
  /** Weight/PIN based charge; the free-shipping threshold still applies. */
  shippingChargeMinor?: number
): OrderTotals {
  const discounted = Math.max(0, subtotalMinor - discountMinor);
  let shippingMinor: number;
  if (shippingChargeMinor === undefined) {
    shippingMinor = calculateShippingFee(discounted);
  } else {
    shippingMinor =
      discounted >= FREE_SHIPPING_THRESHOLD_PAISE ? 0 : shippingChargeMinor;
  }
  return {
    subtotalMinor,
    discountMinor,
    shippingMinor,
    taxMinor: calculateInclusiveGst(discounted),
    totalMinor: discounted + shippingMinor,
  };
}
