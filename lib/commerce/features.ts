import "server-only";
import { env } from "@/lib/env";

export function isCheckoutEnabled() {
  return env.CHECKOUT_ENABLED === "true";
}

export function requireCheckoutEnabled() {
  if (!isCheckoutEnabled()) {
    throw new Error("Website checkout is not available yet");
  }
}
