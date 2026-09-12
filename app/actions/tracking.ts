"use server";

import { lookupGuestOrder } from "@/lib/commerce/customer-account";

export interface TrackOrderResult {
  success?: boolean;
  error?: string;
  data?: Awaited<ReturnType<typeof lookupGuestOrder>>;
}

export async function trackOrderAction(
  orderNumber: string,
  contact: string
): Promise<TrackOrderResult> {
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
