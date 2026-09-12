import { createHash, randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import {
  cartItems,
  checkoutAttempts,
  productVariants,
} from "@/db/schema";
import { db } from "@/lib/db";

import {
  FREE_SHIPPING_THRESHOLD_PAISE,
  GST_RATE,
  STANDARD_SHIPPING_PAISE,
  calculateInclusiveGst,
  calculateShippingFee,
  isPincodeServiceable,
} from "./rules";

export {
  FREE_SHIPPING_THRESHOLD_PAISE,
  GST_RATE,
  STANDARD_SHIPPING_PAISE,
  calculateInclusiveGst,
  calculateShippingFee,
  isPincodeServiceable,
};

export interface ShippingAddressInput {
  recipient: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postcode: string;
  countryCode?: string;
}

export async function calculateCheckoutQuote(params: {
  cartId: string;
  shippingAddress: ShippingAddressInput;
}) {
  const { cartId, shippingAddress } = params;

  if (!isPincodeServiceable(shippingAddress.postcode)) {
    throw new Error("Invalid or unserviceable PIN code. Please enter a valid 6-digit Indian PIN code.");
  }

  // Fetch cart items with fresh variant prices
  const items = await db
    .select({
      cartItemId: cartItems.id,
      variantId: cartItems.variantId,
      quantity: cartItems.quantity,
      sku: productVariants.sku,
      title: productVariants.title,
      priceMinor: productVariants.priceMinor,
      active: productVariants.active,
      weightG: productVariants.weightG,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .where(eq(cartItems.cartId, cartId));

  if (items.length === 0) {
    throw new Error("Cannot calculate quote for an empty cart.");
  }

  const quoteItems = items.map((item) => {
    if (!item.active || item.priceMinor === null || item.priceMinor <= 0) {
      throw new Error(`Item ${item.sku} is currently not available for purchase.`);
    }

    const lineTotalMinor = item.priceMinor * item.quantity;
    return {
      variantId: item.variantId,
      sku: item.sku,
      title: item.title,
      unitPriceMinor: item.priceMinor,
      quantity: item.quantity,
      lineTotalMinor,
      weightG: item.weightG ?? 300,
    };
  });

  const subtotalMinor = quoteItems.reduce((acc, it) => acc + it.lineTotalMinor, 0);

  // Shipping calculation
  const isFreeShipping = subtotalMinor >= FREE_SHIPPING_THRESHOLD_PAISE;
  const shippingMinor = isFreeShipping ? 0 : STANDARD_SHIPPING_PAISE;

  // 18% GST (already inclusive in product selling price, but explicitly broken out for invoices)
  // Tax component = Total * (GST / (1 + GST))
  const taxMinor = Math.round(subtotalMinor * (GST_RATE / (1 + GST_RATE)));

  const totalMinor = subtotalMinor + shippingMinor;

  // Generate deterministic quote hash and attempt
  const quoteData = {
    subtotalMinor,
    shippingMinor,
    taxMinor,
    totalMinor,
    currency: "INR",
    isFreeShipping,
    items: quoteItems,
    shippingAddress: {
      ...shippingAddress,
      countryCode: shippingAddress.countryCode || "IN",
    },
  };

  const requestHash = createHash("sha256")
    .update(JSON.stringify(quoteData))
    .digest("hex");

  const idempotencyKey = `quote-${cartId}-${Date.now()}`;
  const quoteExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour quote validity

  const [attempt] = await db
    .insert(checkoutAttempts)
    .values({
      cartId,
      idempotencyKey,
      requestHash,
      status: "quoted",
      quoteSnapshot: quoteData,
      quoteExpiresAt,
    })
    .returning();

  return {
    attemptId: attempt.id,
    ...quoteData,
    quoteExpiresAt,
  };
}
