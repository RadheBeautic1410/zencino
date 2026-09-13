/**
 * In-memory sliding-window rate limiter for sensitive public routes.
 * Operates with zero external dependencies and automatic stale bucket eviction.
 */

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

interface RateLimitConfig {
  /** Maximum number of allowed requests in the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Evict stale records periodically (every 10 minutes)
const EVICTION_INTERVAL_MS = 10 * 60 * 1000;
let lastEviction = Date.now();

function evictStale(windowMs: number) {
  const now = Date.now();
  if (now - lastEviction < EVICTION_INTERVAL_MS) return;
  lastEviction = now;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.lastRefill > windowMs * 2) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check whether a client identifier (e.g., IP or token) has exceeded the rate limit.
 * Returns { success: boolean, remaining: number, resetMs: number }
 */
export function checkRateLimit(
  identifier: string,
  routeKey: string,
  config: RateLimitConfig
): {
  success: boolean;
  remaining: number;
  resetMs: number;
} {
  const key = `${routeKey}:${identifier}`;
  const now = Date.now();
  evictStale(config.windowMs);

  let entry = rateLimitStore.get(key);

  if (!entry) {
    entry = {
      tokens: config.maxRequests - 1,
      lastRefill: now,
    };
    rateLimitStore.set(key, entry);
    return {
      success: true,
      remaining: entry.tokens,
      resetMs: config.windowMs,
    };
  }

  const elapsed = now - entry.lastRefill;

  // If elapsed time exceeds window, reset tokens
  if (elapsed >= config.windowMs) {
    entry.tokens = config.maxRequests - 1;
    entry.lastRefill = now;
    return {
      success: true,
      remaining: entry.tokens,
      resetMs: config.windowMs,
    };
  }

  // Still within window
  if (entry.tokens > 0) {
    entry.tokens -= 1;
    return {
      success: true,
      remaining: entry.tokens,
      resetMs: config.windowMs - elapsed,
    };
  }

  // Rate limit exceeded
  return {
    success: false,
    remaining: 0,
    resetMs: config.windowMs - elapsed,
  };
}

/** Preconfigured route policies */
export const RATE_LIMIT_POLICIES = {
  /** Support inquiry: 5 inquiries per 10 minutes */
  SUPPORT_INQUIRY: { maxRequests: 5, windowMs: 10 * 60 * 1000 },
  /** Guest order lookup: 10 lookups per 5 minutes */
  GUEST_TRACKING: { maxRequests: 10, windowMs: 5 * 60 * 1000 },
  /** Payment proof upload: 10 uploads per 10 minutes */
  PAYMENT_PROOF: { maxRequests: 10, windowMs: 10 * 60 * 1000 },
  /** Return damage photo upload: 10 uploads per 10 minutes */
  RETURN_PHOTO: { maxRequests: 10, windowMs: 10 * 60 * 1000 },
  /** Checkout quote: 30 quotes per 5 minutes */
  CHECKOUT_QUOTE: { maxRequests: 30, windowMs: 5 * 60 * 1000 },
} as const;

/** Helper to clear rate limit state (useful in testing) */
export function resetRateLimitStore() {
  rateLimitStore.clear();
}

/** Helper to extract client identifier from incoming request headers */
export function getClientIdentifier(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return headers.get("x-real-ip") || "127.0.0.1";
}
