/**
 * Request logging wrapper for API routes.
 * Wraps route handlers to automatically log requests with duration and status.
 * Supports both (request) and (request, context) signatures for static and dynamic routes.
 *
 * Usage:
 * ```typescript
 * export const GET = withRequestLogging(async (request) => { ... });
 * export const PATCH = withRequestLogging(async (request, context) => {
 *   const { params } = context ?? {}; ...
 * });
 * ```
 */

import { NextRequest, NextResponse } from "next/server";
import { withRequestId } from "../api";
import { logRequest } from "../request-log";
import { getIdentifier } from "../rate-limit-redis";

type Handler<T = NextRequest, C = unknown> = (
  request: T,
  context?: C
) => Promise<NextResponse | Response>;

export function withRequestLogging<T extends NextRequest = NextRequest, C = unknown>(
  handler: Handler<T, C>
) {
  return async (request: T, context?: C): Promise<NextResponse | Response> => {
    const startTime = Date.now();
    const requestId = withRequestId(request);
    const route = request.nextUrl.pathname;
    const method = request.method;
    const ip = getIdentifier(request);

    let statusCode = 500;
    let userId: string | undefined;

    try {
      try {
        const { getCurrentUser } = await import("../auth");
        const user = await getCurrentUser();
        userId = user?.id;
      } catch {
        // User not available or not authenticated - that's fine
      }

      const response = await handler(request, context);
      statusCode = response.status;

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
        console.error("[request-log] Failed to log request:", error);
      });

      return response;
    } catch (error) {
      statusCode = 500;

      logRequest({
        requestId,
        route,
        method,
        statusCode,
        durationMs: Date.now() - startTime,
        userId,
        ip,
        createdAt: new Date(),
      }).catch((logErr) => {
        console.error("[request-log] Failed to log error request:", logErr);
      });

      throw error;
    }
  };
}
