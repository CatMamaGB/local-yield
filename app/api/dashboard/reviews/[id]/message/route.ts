/**
 * POST /api/dashboard/reviews/[id]/message — get or create conversation with reviewer for this review.
 * Returns conversationId so producer can open the private chat. Order is linked when available.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProducerOrAdmin } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { logError } from "@/lib/logger";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request, RATE_LIMIT_PRESETS.MESSAGES, requestId);
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await requireProducerOrAdmin();
    const { id: reviewId } = await params;
    if (!reviewId) return fail("Missing review id", { code: "VALIDATION_ERROR", status: 400 });

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { revieweeId: true, reviewerId: true, orderId: true },
    });
    if (!review || review.revieweeId !== user.id) return fail("Review not found or you are not the producer.", { code: "NOT_FOUND", status: 404 });

    const producerId = user.id;
    const buyerId = review.reviewerId;
    const orderId = review.orderId ?? undefined;
    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          {
            OR: [
              { userAId: producerId, userBId: buyerId },
              { userAId: buyerId, userBId: producerId },
            ],
          },
          { orderId: orderId ?? null },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userAId: producerId,
          userBId: buyerId,
          orderId: orderId ?? null,
        },
      });
    }

    return ok({ conversationId: conversation.id });
  } catch (e) {
    logError("dashboard/reviews/[id]/message/POST", e, { requestId, path: "/api/dashboard/reviews/[id]/message", method: "POST" });
    const message = e instanceof Error ? e.message : "";
    if (message === "Forbidden") return fail(message, { code: "FORBIDDEN", status: 403 });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
