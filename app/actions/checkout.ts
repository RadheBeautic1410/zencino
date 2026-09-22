"use server";

import { getCartDetails } from "@/lib/commerce/cart";
import { calculateCheckoutQuote } from "@/lib/commerce/quotes";

export interface QuoteActionResult {
  error?: string;
  quote?: {
    attemptId: string;
    subtotalMinor: number;
    shippingMinor: number;
    taxMinor: number;
    totalMinor: number;
    isFreeShipping: boolean;
    quoteExpiresAt: Date;
  };
  success?: boolean;
}

export async function createCheckoutQuoteAction(
  formData: FormData
): Promise<QuoteActionResult> {
  const recipient = String(formData.get("recipient") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const line1 = String(formData.get("line1") || "").trim();
  const line2 = String(formData.get("line2") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const postcode = String(formData.get("postcode") || "").trim();

  if (!recipient || !phone || !line1 || !city || !state || !postcode) {
    return { error: "Please fill in all required shipping address fields." };
  }

  const cart = await getCartDetails();
  if (!cart.cartId || cart.items.length === 0) {
    return { error: "Your bag is empty." };
  }

  try {
    const quote = await calculateCheckoutQuote({
      cartId: cart.cartId,
      shippingAddress: {
        recipient,
        phone,
        line1,
        line2,
        city,
        state,
        postcode,
        countryCode: "IN",
      },
    });

    return {
      success: true,
      quote: {
        attemptId: quote.attemptId,
        subtotalMinor: quote.subtotalMinor,
        shippingMinor: quote.shippingMinor,
        taxMinor: quote.taxMinor,
        totalMinor: quote.totalMinor,
        isFreeShipping: quote.isFreeShipping,
        quoteExpiresAt: quote.quoteExpiresAt,
      },
    };
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to calculate quote";
    return { error: msg };
  }
}
