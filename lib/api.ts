/**
 * Standard API response helpers for consistent error handling across routes.
 */

import { NextResponse } from "next/server";

/**
 * Success response helper
 */
export function ok(data?: any) {
  return NextResponse.json({ ok: true, data });
}

/**
 * Error response helper
 */
export function fail(error: string, code?: string, status: number = 400) {
  return NextResponse.json(
    {
      ok: false,
      error,
      ...(code && { code }),
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
