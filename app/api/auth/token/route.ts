/**
 * POST /api/auth/token — Dev-only: get dev token or verify auth.
 *
 * PRODUCTION: Returns 404. We do NOT issue our own tokens; mobile uses Clerk.getToken().
 * DEVELOPMENT: Returns dev token (dev:userId) or auth status so you can confirm auth is wired.
 *
 * Code guard: In production this route is disabled so it cannot become a security hole.
 */

import { NextRequest, NextResponse } from "next/server";
import { ok, fail, withRequestId, addCorsHeaders } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  const requestId = withRequestId(request);

  // CODE GUARD: In production, this endpoint does not exist. No token issuance in prod.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(null, { status: 404 });
  }

  if (request.method === "OPTIONS") {
    return addCorsHeaders(new NextResponse(null, { status: 204 }), request);
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      const errorResponse = fail("Unauthorized", { code: "UNAUTHORIZED", status: 401, requestId });
      return addCorsHeaders(errorResponse, request);
    }

    const isClerkConfigured = Boolean(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
    );

    if (isClerkConfigured) {
      // Auth echo only: confirm auth is wired. Mobile must use Clerk.getToken().
      const { sessionId } = await auth();
      const response = ok({
        authenticated: true,
        userId: user.id,
        note: "In production use Clerk.getToken() and send JWT in Authorization header",
        sessionId: sessionId || null,
      }, requestId);
      return addCorsHeaders(response, request);
    }

    // Dev stub: issue simple dev token for local testing
    const response = ok({
      token: `dev:${user.id}`,
      userId: user.id,
      expiresIn: 86400,
      expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
    }, requestId);
    return addCorsHeaders(response, request);
  } catch {
    const errorResponse = fail("Token request failed", {
      code: "INTERNAL_ERROR",
      status: 500,
      requestId,
    });
    return addCorsHeaders(errorResponse, request);
  }
}

export async function OPTIONS(request: NextRequest) {
  const { handleCorsPreflight } = await import("@/lib/api");
  return handleCorsPreflight(request) || new Response(null, { status: 403 });
}
