/**
 * GET /api/credits/balance?producerId=... — Available store credit for current user with that producer.
 */

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCreditBalance } from "@/lib/credits";
import { ok, fail, withRequestId } from "@/lib/api";
import { logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const requestId = withRequestId(request);
  const user = await getCurrentUser();
  if (!user) {
    return fail("Unauthorized", { code: "UNAUTHORIZED", status: 401, requestId });
  }

  const producerId = request.nextUrl.searchParams.get("producerId");
  if (!producerId) {
    return fail("producerId required", { code: "VALIDATION_ERROR", status: 400, requestId });
  }

  try {
    const balanceCents = await getCreditBalance(user.id, producerId);
    return ok({ balanceCents }, requestId);
  } catch (error) {
    logError("credits/balance/GET", error, { requestId, path: "/api/credits/balance", method: "GET" });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
