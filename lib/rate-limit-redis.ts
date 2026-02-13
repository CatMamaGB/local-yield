/**
 * Redis-backed rate limiter using Upstash Redis (fixed-window counter).
 * Used by lib/rate-limit.ts when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set.
 * Do not log secrets (URL/token).
 */

import { Redis } from "@upstash/redis";
import { fail } from "@/lib/api";

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
}

/** Preset names for Redis key; derived from (windowMs, max) when not a known preset. */
function presetNameFromOptions(windowMs: number, max: number): string {
  if (windowMs === 60_000 && max === 20) return "AUTH";
  if (windowMs === 60_000 && max === 60) return "DEFAULT";
  if (windowMs === 60_000 && max === 120) return "MESSAGES";
  return `w${windowMs}_m${max}`;
}

/** Robust IP: x-forwarded-for first IP, then request.ip (Vercel/Next), then "unknown". */
export function getIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]?.trim() : null;
  if (ip) return ip;
  const req = request as Request & { ip?: string };
  if (typeof req.ip === "string" && req.ip) return req.ip;
  return "unknown";
}

/**
 * Check rate limit using Redis. Key = `${ip}:${presetName}:${windowStart}`.
 * Increment atomically; set TTL to windowMs. Returns 429 Response if over limit.
 */
export async function checkRateLimitRedis(
  request: Request,
  options: RateLimitOptions,
  windowMs: number,
  max: number
): Promise<Response | null> {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const ip = getIdentifier(request);
  const presetName = presetNameFromOptions(windowMs, max);
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const key = `rl:${ip}:${presetName}:${windowStart}`;

  const count = await redis.incr(key);
  await redis.pexpire(key, windowMs);

  if (count > max) {
    return fail("Too many requests", "RATE_LIMIT", 429);
  }

  return null;
}
