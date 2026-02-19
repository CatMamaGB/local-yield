/**
 * PATCH /api/auth/primary-mode — Set user's primary mode (MARKET | SELL | CARE).
 * Body: { primaryMode: "MARKET" | "SELL" | "CARE" }.
 */

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";
import { logError } from "@/lib/logger";
import { LAST_ACTIVE_MODE_COOKIE } from "@/lib/redirects";

const VALID = ["MARKET", "SELL", "CARE"] as const;

export async function PATCH(request: NextRequest) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request, RATE_LIMIT_PRESETS.AUTH, requestId);
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", { code: "UNAUTHORIZED", status: 401 });

    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) return fail(parseError, { code: "INVALID_JSON", status: 400 });

    const primaryMode = body?.primaryMode;
    if (!VALID.includes(primaryMode)) {
      return fail("primaryMode must be MARKET, SELL, or CARE", { code: "INVALID_MODE", status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { primaryMode },
    });

    const res = ok({ primaryMode });
    // Set lastActiveMode cookie so post-login routing uses it (cart → lastActiveMode → market).
    res.cookies.set(LAST_ACTIVE_MODE_COOKIE, primaryMode, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false, // allow client to read for redirect hints if needed
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (error) {
    logError("auth/primary-mode/PATCH", error, { requestId, path: "/api/auth/primary-mode", method: "PATCH" });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
