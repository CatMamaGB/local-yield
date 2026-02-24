/**
 * GET /api/dashboard/summary — returns alert counts for current user (producer/admin).
 * Returns: { pendingOrdersCount, unreadMessagesCount, pendingReviewsCount }
 */

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getProducerAlertCounts } from "@/lib/dashboard-alerts";
import { ok, fail, addCorsHeaders, handleCorsPreflight } from "@/lib/api";
import { logError } from "@/lib/logger";
import { getRequestId } from "@/lib/request-id";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", { code: "UNAUTHORIZED", status: 401 });

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
    const response = ok(counts, requestId);
    return addCorsHeaders(response, request);
  } catch (error) {
    logError("dashboard/summary/GET", error, { requestId, path: "/api/dashboard/summary", method: "GET" });
    const errorResponse = fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
    return addCorsHeaders(errorResponse, request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request) || new Response(null, { status: 403 });
}
