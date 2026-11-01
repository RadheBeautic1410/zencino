"use client";

import { recordClientAnalyticsAction } from "@/app/actions/campaigns";

// Funnel events go to three places: our own analytics_events table (admin
// funnel), GA4 e-commerce events, and the Meta Pixel (for ad optimisation).
// Each sink is a silent no-op when it is not configured or not loaded.

export interface TrackedItem {
  id: string;
  name: string;
  priceMinor: number;
  quantity: number;
  variant?: string;
}

type FunnelEvent =
  | "product_view"
  | "add_to_cart"
  | "checkout_started"
  | "payment_started"
  | "purchase";

const GA_EVENT: Record<FunnelEvent, string> = {
  product_view: "view_item",
  add_to_cart: "add_to_cart",
  checkout_started: "begin_checkout",
  payment_started: "add_payment_info",
  purchase: "purchase",
};

const META_EVENT: Record<FunnelEvent, string> = {
  product_view: "ViewContent",
  add_to_cart: "AddToCart",
  checkout_started: "InitiateCheckout",
  payment_started: "AddPaymentInfo",
  purchase: "Purchase",
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const INTERNAL_KEY = "zen_internal";

/** True on browsers where an admin has browsed the store; never tracked. */
export function isInternalVisitor(): boolean {
  try {
    return localStorage.getItem(INTERNAL_KEY) === "1";
  } catch {
    return false;
  }
}

export function markInternalVisitor() {
  try {
    localStorage.setItem(INTERNAL_KEY, "1");
  } catch {
    // storage blocked: the server still skips admin events
  }
}

function readTrackingContext() {
  let sessionId: string | undefined;
  let campaignCode: string | null = null;
  try {
    sessionId = localStorage.getItem("zen_anon_session") || undefined;
    const match = document.cookie.match(/(?:^|; )zen_attribution=([^;]*)/);
    if (match) {
      campaignCode = JSON.parse(decodeURIComponent(match[1])).campaignCode;
    }
  } catch {
    // storage blocked or malformed cookie: track without attribution
  }
  return { sessionId, campaignCode };
}

export function trackFunnel(
  event: FunnelEvent,
  data: {
    items: TrackedItem[];
    valueMinor: number;
    transactionId?: string;
    productId?: string;
    variantId?: string;
  }
) {
  try {
    if (isInternalVisitor()) {
      return;
    }
    const value = data.valueMinor / 100;
    const items = data.items.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      item_variant: item.variant,
      price: item.priceMinor / 100,
      quantity: item.quantity,
    }));

    // On a fresh landing, page effects can run before the StoreShell trackers
    // (hydrated inside Suspense) set up gtag/fbq, so defer a tick.
    setTimeout(() => {
      window.gtag?.("event", GA_EVENT[event], {
        currency: "INR",
        value,
        items,
        transaction_id: data.transactionId,
      });

      window.fbq?.("track", META_EVENT[event], {
        currency: "INR",
        value,
        content_type: "product",
        content_ids: data.items.map((item) => item.id),
        num_items: data.items.reduce((sum, item) => sum + item.quantity, 0),
      });
    }, 0);

    // purchase_confirmed is recorded server-side once an admin verifies payment.
    if (
      event === "product_view" ||
      event === "add_to_cart" ||
      event === "checkout_started"
    ) {
      const { sessionId, campaignCode } = readTrackingContext();
      recordClientAnalyticsAction({
        eventName: event,
        campaignCode,
        productId: data.productId,
        variantId: data.variantId,
        path: window.location.pathname,
        anonymousSessionId: sessionId,
      }).catch(() => {
        // analytics must never break the storefront
      });
    }
  } catch {
    // analytics must never break the storefront
  }
}
