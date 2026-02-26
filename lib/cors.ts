/**
 * CORS helpers for API routes.
 * Allows mobile app and other clients to access the API.
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * Allowed origins for CORS.
 * Add your mobile app URLs here when ready.
 */
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_WEB_URL || "https://thelocalyield.com",
  process.env.EXPO_PUBLIC_MOBILE_URL,
  // Local development
  "http://localhost:3000",
  "http://localhost:8081", // Expo default
  "http://localhost:19006", // Expo web
].filter(Boolean) as string[];

/**
 * Check if origin is allowed.
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some((allowed) => {
    if (allowed === origin) return true;
    // Support wildcard subdomains for development
    if (allowed.includes("*")) {
      const pattern = allowed.replace("*", ".*");
      return new RegExp(`^${pattern}$`).test(origin);
    }
    return false;
  });
}

export interface CorsOptions {
  /** When true, set Access-Control-Allow-Credentials: true. Default false for Bearer-only APIs to reduce cookie/CSRF surface. */
  credentials?: boolean;
}

/**
 * Get CORS headers for a request.
 * Returns headers object to add to response.
 * credentials defaults to false (opt-in) for Bearer-only mobile API.
 */
export function getCorsHeaders(request: NextRequest, options?: CorsOptions): Record<string, string> {
  const origin = request.headers.get("origin");
  const isAllowed = isOriginAllowed(origin);

  if (!isAllowed) {
    return {};
  }

  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": origin!,
    // Prevent caches/CDNs from reusing an allowed-origin response for another origin (MDN CORS).
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    // Allow browser JS to read these response headers (e.g. Retry-After on 429, requestId).
    "Access-Control-Expose-Headers": "Retry-After, X-Request-Id",
    "Access-Control-Max-Age": "86400", // 24 hours
  };
  if (options?.credentials === true) {
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  return headers;
}

/**
 * Handle OPTIONS preflight request.
 * Call this in API routes for OPTIONS method.
 */
export function handleCorsPreflight(request: NextRequest, options?: CorsOptions): NextResponse | null {
  const headers = getCorsHeaders(request, options);
  if (Object.keys(headers).length === 0) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, { status: 204, headers });
}

/**
 * Add CORS headers to a NextResponse.
 * Use this in API route handlers before returning.
 */
export function addCorsHeaders(
  response: NextResponse,
  request: NextRequest,
  options?: CorsOptions
): NextResponse {
  const headers = getCorsHeaders(request, options);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
