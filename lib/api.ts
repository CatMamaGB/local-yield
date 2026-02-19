/**
 * Standard API response helpers for consistent error handling across routes.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRequestId } from "./request-id";

/**
 * Standard API response type. All routes should return this shape.
 */
export type ApiResponse<T> =
  | { ok: true; data: T; requestId?: string }
  | {
      ok: false;
      error: string | { code: string; message: string };
      code?: string;
      requestId?: string;
    };

/**
 * Get request ID from request (reads header or generates short ID).
 * Use this at the start of route handlers to get requestId for responses.
 */
export function withRequestId(request: NextRequest | Request): string {
  return getRequestId(request);
}

/**
 * Success response helper. Attaches requestId if provided.
 */
export function ok<T>(data: T, requestId?: string) {
  return NextResponse.json({ ok: true, data, ...(requestId && { requestId }) });
}

/**
 * Error response helper. Use options object so requestId and extra are unambiguous.
 * Do not leak stack traces or sensitive data in extra.
 * For validation or client-branchable errors, prefer failStructured so clients can rely on error.code.
 */
export function fail(
  message: string,
  opts?: {
    code?: string;
    status?: number;
    requestId?: string;
    extra?: Record<string, string | number | boolean | null>;
  }
) {
  const { code, status = 400, requestId, extra } = opts ?? {};
  return NextResponse.json(
    {
      ok: false,
      error: message,
      ...(code && { code }),
      ...(requestId && { requestId }),
      ...(extra && Object.keys(extra).length > 0 ? extra : {}),
    },
    { status }
  );
}

/**
 * Structured error response: { ok: false, error: { code, message } }.
 * Prefer this for validation and client-branchable errors so clients can use error.code without string-matching.
 */
export function failStructured(
  error: { code: string; message: string },
  status: number = 400,
  requestId?: string
) {
  return NextResponse.json(
    {
      ok: false,
      error: { code: error.code, message: error.message },
      ...(requestId && { requestId }),
    },
    { status }
  );
}

/**
 * Parse JSON body safely with error handling
 */
export async function parseJsonBody<T = any>(request: Request): Promise<{ data?: T; error?: string }> {
  try {
    const data = await request.json();
    return { data };
  } catch {
    return { error: "Invalid JSON" };
  }
}
