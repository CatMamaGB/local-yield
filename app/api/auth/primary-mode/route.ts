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

const VALID = ["MARKET", "SELL", "CARE"] as const;

export async function PATCH(request: NextRequest) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request, RATE_LIMIT_PRESETS.AUTH);
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", "UNAUTHORIZED", 401);

    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) return fail(parseError, "INVALID_JSON", 400);

    const primaryMode = body?.primaryMode;
    if (!VALID.includes(primaryMode)) {
      return fail("primaryMode must be MARKET, SELL, or CARE", "INVALID_MODE", 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { primaryMode },
    });

    return ok({ primaryMode });
  } catch (error) {
    logError("auth/primary-mode/PATCH", error, { requestId, path: "/api/auth/primary-mode", method: "PATCH" });
    return fail("Something went wrong", "INTERNAL_ERROR", 500, { requestId });
  }
}
