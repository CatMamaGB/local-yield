/**
 * Auth error handler for API routes.
 * Maps auth errors (Unauthorized/Forbidden) to proper HTTP status codes and API responses.
 * 
 * Usage:
 *   try {
 *     const user = await requireProducerOrAdmin();
 *   } catch (e) {
 *     return mapAuthErrorToResponse(e, requestId);
 *   }
 */

import { NextResponse } from "next/server";
import { fail } from "../api";

/**
 * Map auth error to proper API response.
 * - "Unauthorized" (no/invalid token) → 401 UNAUTHORIZED
 * - "Forbidden" (wrong role/capability) → 403 FORBIDDEN
 * - Other errors → 500 INTERNAL_ERROR
 */
export function mapAuthErrorToResponse(
  error: unknown,
  requestId?: string
): NextResponse {
  const message = error instanceof Error ? error.message : "Forbidden";
  
  if (message === "Unauthorized") {
    return fail("Unauthorized", {
      code: "UNAUTHORIZED",
      status: 401,
      requestId,
    });
  }
  
  if (message === "Forbidden") {
    return fail("Forbidden", {
      code: "FORBIDDEN",
      status: 403,
      requestId,
    });
  }
  
  // Unknown error - return 500 but don't leak details
  return fail("Something went wrong", {
    code: "INTERNAL_ERROR",
    status: 500,
    requestId,
  });
}
