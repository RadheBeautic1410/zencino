"use server";

import { headers } from "next/headers";
import { lookupGuestOrder } from "@/lib/commerce/customer-account";
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMIT_POLICIES,
} from "@/lib/security/rate-limit";

export interface TrackOrderResult {
  data?: Awaited<ReturnType<typeof lookupGuestOrder>>;
  error?: string;
  success?: boolean;
}

export async function trackOrderAction(
  orderNumber: string,
  contact: string
): Promise<TrackOrderResult> {
  const h = await headers();
  const clientId = getClientIdentifier(h);
  const limitCheck = checkRateLimit(
    clientId,
    "guest_tracking",
    RATE_LIMIT_POLICIES.GUEST_TRACKING
  );
  if (!limitCheck.success) {
    return {
      error: `Too many tracking attempts. Please wait ${Math.ceil(limitCheck.resetMs / 1000)} seconds before trying again.`,
    };
  }

  try {
    const data = await lookupGuestOrder(orderNumber, contact);
    return { success: true, data };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to locate order with provided details.";
    return { error: message };
  }
}
