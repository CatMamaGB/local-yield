/**
 * GET /api/dashboard/summary — returns alert counts for current user (producer/admin).
 * Returns: { pendingOrdersCount, unreadMessagesCount, pendingReviewsCount }
 */

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getProducerAlertCounts } from "@/lib/dashboard-alerts";
import { ok, fail } from "@/lib/api";
import { logError } from "@/lib/logger";
import { getRequestId } from "@/lib/request-id";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", "UNAUTHORIZED", 401);

    const isProducerOrAdmin =
      user.role === "PRODUCER" || user.role === "ADMIN" || user.isProducer === true;

    if (!isProducerOrAdmin) {
      return ok({
        pendingOrdersCount: 0,
        unreadMessagesCount: 0,
        pendingReviewsCount: 0,
      });
    }

    const counts = await getProducerAlertCounts(user.id);
    return ok(counts);
  } catch (error) {
    logError("dashboard/summary/GET", error, { requestId, path: "/api/dashboard/summary", method: "GET" });
    return fail("Something went wrong", "INTERNAL_ERROR", 500, { requestId });
  }
}
