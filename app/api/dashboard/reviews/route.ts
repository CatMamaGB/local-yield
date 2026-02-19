/**
 * GET /api/dashboard/reviews — list pending reviews for current producer (private, not yet approved).
 */

import { NextRequest } from "next/server";
import { requireProducerOrAdmin } from "@/lib/auth";
import { getPendingReviewsForProducer } from "@/lib/reviews";
import { ok, fail } from "@/lib/api";
import { logError } from "@/lib/logger";
import { getRequestId } from "@/lib/request-id";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  try {
    const user = await requireProducerOrAdmin();
    const reviews = await getPendingReviewsForProducer(user.id);
    return ok({
      reviews: reviews.map((r) => ({
        id: r.id,
        comment: r.comment,
        rating: r.rating,
        producerResponse: r.producerResponse,
        resolved: r.resolved,
        privateFlag: r.privateFlag,
        createdAt: r.createdAt.toISOString(),
        reviewer: r.reviewer,
        orderId: r.order?.id ?? null,
      })),
    });
  } catch (e) {
    logError("dashboard/reviews/GET", e, { requestId, path: "/api/dashboard/reviews", method: "GET" });
    const message = e instanceof Error ? e.message : "Forbidden";
    return fail(message, { code: "FORBIDDEN", status: 403 });
  }
}
