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
  const rateLimitRes = await checkRateLimit(request, undefined, requestId);
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await requireAuth();
    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) return fail(parseError, { code: "INVALID_JSON", status: 400 });

    const orderId = body?.orderId ? String(body.orderId).trim() : "";
    const careBookingId = body?.careBookingId ? String(body.careBookingId).trim() : "";
    const comment = body?.comment ? String(body.comment).trim() : "";
    
    if ((!orderId && !careBookingId) || !comment) {
      return fail("orderId or careBookingId and comment required", { code: "VALIDATION_ERROR", status: 400 });
    }
    
    const rating = body?.rating != null ? Number(body.rating) : undefined;
    if (rating != null && (rating < 1 || rating > 5 || !Number.isInteger(rating))) {
      return fail("rating must be 1–5", { code: "VALIDATION_ERROR", status: 400 });
    }
    const privateFlag = body?.privateFlag !== false;

    // Handle market order review (buyer reviews producer, or producer reviews buyer)
    if (orderId) {
      const revieweeIdParam = body?.revieweeId ? String(body.revieweeId).trim() : null;
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, buyerId: true, producerId: true, status: true },
      });
      if (!order) return fail("Order not found", { code: "NOT_FOUND", status: 404 });

      const isBuyer = order.buyerId === user.id;
      const isProducer = order.producerId === user.id;

      if (revieweeIdParam) {
        // Producer reviewing buyer (revieweeId must be the buyer)
        if (!isProducer) return fail("Only the producer can review the buyer", { code: "FORBIDDEN", status: 403 });
        if (revieweeIdParam !== order.buyerId) return fail("revieweeId must be the order buyer", { code: "VALIDATION_ERROR", status: 400 });
        if (order.status !== "FULFILLED") return fail("You can only review the buyer after the order is fulfilled", { code: "VALIDATION_ERROR", status: 400 });

        const existing = await prisma.review.findFirst({
          where: { orderId: order.id, reviewerId: user.id, type: "MARKET", revieweeId: order.buyerId },
        });
        if (existing) return fail("You have already left a review for this buyer", { code: "VALIDATION_ERROR", status: 400 });

        const review = await createReview({
          reviewerId: user.id,
          revieweeId: order.buyerId,
          producerId: order.producerId,
          type: "MARKET",
          orderId: order.id,
          comment,
          rating,
          privateFlag,
        });
        return ok({ review: { id: review.id, privateFlag: review.privateFlag } });
      }

      // Buyer reviewing producer
      if (!isBuyer) return fail("You are not the buyer of this order", { code: "FORBIDDEN", status: 403 });
      if (order.status !== "FULFILLED") return fail("You can only review after the order is fulfilled", { code: "VALIDATION_ERROR", status: 400 });

      const existing = await prisma.review.findFirst({
        where: { orderId: order.id, reviewerId: user.id, type: "MARKET" },
      });
      if (existing) return fail("You have already left a review for this order", { code: "VALIDATION_ERROR", status: 400 });

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
    }

    // Handle care booking review
    if (careBookingId) {
      const booking = await prisma.careBooking.findFirst({
        where: { id: careBookingId, careSeekerId: user.id },
        select: { id: true, caregiverId: true, status: true },
      });
      if (!booking) return fail("Booking not found or you are not the seeker", { code: "NOT_FOUND", status: 404 });
      if (booking.caregiverId === user.id) return fail("You cannot review your own booking", { code: "VALIDATION_ERROR", status: 400 });
      
      if (booking.status !== "COMPLETED") {
        return fail("You can only review completed bookings", { code: "VALIDATION_ERROR", status: 400 });
      }

      const existing = await prisma.review.findFirst({
        where: { careBookingId: booking.id, reviewerId: user.id, type: "CARE" },
      });
      if (existing) return fail("You have already left a review for this booking", { code: "VALIDATION_ERROR", status: 400 });

      const review = await createReview({
        reviewerId: user.id,
        revieweeId: booking.caregiverId,
        producerId: booking.caregiverId,
        type: "CARE",
        careBookingId: booking.id,
        comment,
        rating,
        privateFlag,
      });
      return ok({ review: { id: review.id, privateFlag: review.privateFlag } });
    }

    return fail("orderId or careBookingId required", { code: "VALIDATION_ERROR", status: 400 });
  } catch (e) {
    logError("reviews/POST", e, { requestId, path: "/api/reviews", method: "POST" });
    const message = e instanceof Error ? e.message : "";
    if (message === "Forbidden") return fail(message, { code: "FORBIDDEN", status: 403 });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
