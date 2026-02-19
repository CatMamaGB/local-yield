/**
 * Request logging: track API requests for observability and debugging.
 * Logs status code, route, method, duration, requestId, userId, IP.
 * Can use DB (RequestLog model) or external service later.
 */

import { prisma } from "./prisma";

export interface RequestLog {
  requestId: string;
  route: string;
  method: string;
  statusCode: number;
  durationMs: number;
  userId?: string;
  ip?: string;
  createdAt: Date;
}

/**
 * Log a request. Stores in DB if RequestLog model exists; otherwise console logs.
 * Can be extended to send to external service (Datadog, LogRocket, etc.).
 */
export async function logRequest(log: RequestLog): Promise<void> {
  // Console log for dev/debugging
  if (process.env.NODE_ENV !== "production") {
    console.info("[request-log]", JSON.stringify(log));
  }

  // DB logging (if model exists)
  try {
    await prisma.requestLog.create({
      data: {
        requestId: log.requestId,
        route: log.route,
        method: log.method,
        statusCode: log.statusCode,
        durationMs: log.durationMs,
        userId: log.userId ?? null,
        ip: log.ip ?? null,
        createdAt: log.createdAt,
      },
    });
  } catch (error) {
    // RequestLog model may not exist yet - that's okay, just console log
    if (process.env.NODE_ENV === "production") {
      console.error("[request-log] Failed to save to DB:", error);
    }
  }
}
