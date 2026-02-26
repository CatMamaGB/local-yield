/**
 * Rate limiter for API routes. Uses Upstash Redis when env vars are set;
 * otherwise falls back to in-memory (dev-friendly). Single import point for routes.
 */

import { fail } from "@/lib/api";
import { getIdentifier } from "./rate-limit-redis";
import { checkRateLimitRedis } from "./rate-limit-redis";

const store = new Map<string, { count: number; resetAt: number; max: number; windowMs: number }>();

/** Default: 60 requests per minute per IP. */
const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX = 60;

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
}

/** Presets for common route types. */
export const RATE_LIMIT_PRESETS = {
  /** Auth: 20/min per IP. */
  AUTH: { windowMs: 60_000, max: 20 },
  /** Orders, bookings, reviews: 60/min per IP. */
  DEFAULT: { windowMs: 60_000, max: 60 },
  /** Messages / chatty: 120/min per IP. */
  MESSAGES: { windowMs: 60_000, max: 120 },
} as const;

/** Check if Redis is configured (avoids React hook rule: name must not start with "use"). */
function isRedisConfigured(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return typeof url === "string" && url.length > 0 && typeof token === "string" && token.length > 0;
}

/**
 * In-memory rate limit check. Used when Upstash env vars are missing.
 */
async function checkRateLimitMemory(
  request: Request,
  windowMs: number,
  max: number,
  requestId?: string
): Promise<Response | null> {
  const key = getIdentifier(request);
  const now = Date.now();
  const limitKey = `${key}:${windowMs}:${max}`;

  let entry = store.get(limitKey);
  if (!entry) {
    entry = { count: 1, resetAt: now + windowMs, max, windowMs };
    store.set(limitKey, entry);
    return null;
  }

  if (now >= entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + windowMs;
    return null;
  }

  entry.count += 1;
  if (entry.count > max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    const res = fail("Too many requests. Please try again in a moment.", {
      code: "RATE_LIMIT",
      status: 429,
      requestId,
    });
    res.headers.set("Retry-After", String(retryAfterSeconds));
    return res;
  }

  return null;
}

/**
 * Check rate limit for this request. If over limit, returns a 429 Response.
 * Call at the start of mutation handlers: if (const res = await checkRateLimit(request, preset, requestId)) return res;
 * Options: pass { windowMs, max } or use RATE_LIMIT_PRESETS (e.g. RATE_LIMIT_PRESETS.AUTH).
 * Uses Redis when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set; otherwise in-memory.
 * @param requestId - Request ID to include in rate limit error responses
 */
export async function checkRateLimit(
  request: Request,
  options?: RateLimitOptions,
  requestId?: string
): Promise<Response | null> {
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const max = options?.max ?? DEFAULT_MAX;

  if (isRedisConfigured()) {
    return checkRateLimitRedis(request, { windowMs, max }, windowMs, max, requestId);
  }

  return checkRateLimitMemory(request, windowMs, max, requestId);
}
