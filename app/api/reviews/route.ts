/**
 * POST /api/reviews — buyer creates a review for an order (comment, rating?, private by default).
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createReview } from "@/lib/reviews";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await requireAuth();
    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) return fail(parseError, "INVALID_JSON", 400);

    const orderId = body?.orderId ? String(body.orderId).trim() : "";
    const comment = body?.comment ? String(body.comment).trim() : "";
    if (!orderId || !comment) return fail("orderId and comment required", "VALIDATION_ERROR", 400);
    const rating = body?.rating != null ? Number(body.rating) : undefined;
    if (rating != null && (rating < 1 || rating > 5 || !Number.isInteger(rating))) return fail("rating must be 1–5", "VALIDATION_ERROR", 400);
    const privateFlag = body?.privateFlag !== false;

    const order = await prisma.order.findFirst({
      where: { id: orderId, buyerId: user.id },
      select: { id: true, producerId: true },
    });
    if (!order) return fail("Order not found or you are not the buyer", "NOT_FOUND", 404);

    const existing = await prisma.review.findFirst({
      where: { orderId: order.id, reviewerId: user.id, type: "MARKET" },
    });
    if (existing) return fail("You have already left a review for this order", "VALIDATION_ERROR", 400);

    const review = await createReview({
      reviewerId: user.id,
      revieweeId: order.producerId,
      producerId: order.producerId,
      type: "MARKET",
      orderId: order.id,
      comment,
      rating,
      privateFlag,
    });
    return ok({ review: { id: review.id, privateFlag: review.privateFlag } });
  } catch (e) {
    logError("reviews/POST", e, { requestId, path: "/api/reviews", method: "POST" });
    const message = e instanceof Error ? e.message : "";
    if (message === "Forbidden") return fail(message, "FORBIDDEN", 403);
    return fail("Something went wrong", "INTERNAL_ERROR", 500, { requestId });
  }
}
