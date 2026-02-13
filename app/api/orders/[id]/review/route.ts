/**
 * GET /api/orders/[id]/review — current buyer's review for this order (if any).
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getReviewByOrderForBuyer } from "@/lib/reviews";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { logError } from "@/lib/logger";
import { getRequestId } from "@/lib/request-id";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  try {
    const user = await requireAuth();
    const { id: orderId } = await params;
    if (!orderId) return fail("Missing order id", "VALIDATION_ERROR", 400);

    const order = await prisma.order.findFirst({
      where: { id: orderId, buyerId: user.id },
      select: { id: true },
    });
    if (!order) return fail("Order not found", "NOT_FOUND", 404);

    const review = await getReviewByOrderForBuyer(user.id, orderId);
    if (!review) return ok({ review: null });
    return ok({
      review: {
        id: review.id,
        comment: review.comment,
        rating: review.rating,
        privateFlag: review.privateFlag,
        resolved: review.resolved,
        createdAt: review.createdAt.toISOString(),
        adminGuidance: review.adminGuidance,
      },
    });
  } catch (e) {
    logError("orders/[id]/review/GET", e, { requestId, path: "/api/orders/[id]/review", method: "GET" });
    return fail("Forbidden", "FORBIDDEN", 403);
  }
}
