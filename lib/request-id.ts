/**
 * Request ID for tracing and logging. Use in API routes for consistent error correlation.
 */

import { randomUUID } from "crypto";

const REQUEST_ID_HEADER = "x-request-id";

/**
 * Get or generate a short request ID from the request.
 * Prefer incoming x-request-id header; otherwise generate a short id (first 8 chars of UUID).
 */
export function getRequestId(request: Request): string {
  const incoming = request.headers.get(REQUEST_ID_HEADER);
  if (incoming && typeof incoming === "string" && incoming.length > 0) {
    return incoming.slice(0, 64);
  }
  return randomUUID().slice(0, 8);
}
