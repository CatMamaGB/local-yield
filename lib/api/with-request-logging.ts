/**
 * Request logging wrapper for API routes.
 * Wraps route handlers to automatically log requests with duration and status.
 * 
 * Usage:
 * ```typescript
 * export const GET = withRequestLogging(async (request: NextRequest) => {
 *   // route handler code
 * });
 * ```
 */

import { NextRequest, NextResponse } from "next/server";
import { withRequestId } from "../api";
import { logRequest } from "../request-log";
import { getIdentifier } from "../rate-limit-redis";

export function withRequestLogging<T extends NextRequest>(
  handler: (request: T) => Promise<NextResponse>
) {
  return async (request: T): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = withRequestId(request);
    const route = request.nextUrl.pathname;
    const method = request.method;
    const ip = getIdentifier(request);
    
    let statusCode = 500;
    let userId: string | undefined;

    try {
      // Try to get user ID if available (non-blocking)
      try {
        const { getCurrentUser } = await import("../auth");
        const user = await getCurrentUser();
        userId = user?.id;
      } catch {
        // User not available or not authenticated - that's fine
      }

      const response = await handler(request);
      statusCode = response.status;

      // Log request (non-blocking)
      logRequest({
        requestId,
        route,
        method,
        statusCode,
        durationMs: Date.now() - startTime,
        userId,
        ip,
        createdAt: new Date(),
      }).catch((error) => {
        // Don't fail request if logging fails
        console.error("[request-log] Failed to log request:", error);
      });

      return response;
    } catch (error) {
      statusCode = 500;
      
      // Log error request
      logRequest({
        requestId,
        route,
        method,
        statusCode,
        durationMs: Date.now() - startTime,
        userId,
        ip,
        createdAt: new Date(),
      }).catch((logError) => {
        console.error("[request-log] Failed to log error request:", logError);
      });

      throw error;
    }
  };
}
