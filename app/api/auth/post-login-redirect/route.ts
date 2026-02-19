/**
 * GET /api/auth/post-login-redirect?next=... — Redirects to the computed post-login destination.
 * Used by onboarding "Save & finish later" so the same logic (next= → lastActiveMode → market) applies.
 * Requires no auth; reads __last_active_mode cookie and optional next= (validated).
 * Force dynamic so redirect is never cached (cookie + query affect response).
 */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getPostLoginRedirect } from "@/lib/redirects";

export async function GET(request: NextRequest) {
  const lastActiveMode = request.cookies.get("__last_active_mode")?.value ?? null;
  const requestedUrl = request.nextUrl.searchParams.get("next");
  const path = getPostLoginRedirect(lastActiveMode, {
    hasCart: false,
    requestedUrl: requestedUrl ?? undefined,
  });
  const url = new URL(path, request.url);
  return NextResponse.redirect(url);
}
