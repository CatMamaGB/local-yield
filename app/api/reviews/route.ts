/**
 * POST /api/reviews — buyer creates a review for an order (comment, rating?, private by default).
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createReview } from "@/lib/reviews";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const orderId = body.orderId ? String(body.orderId).trim() : "";
  const comment = body.comment ? String(body.comment).trim() : "";
  if (!orderId || !comment) {
    return Response.json({ error: "orderId and comment required" }, { status: 400 });
  }
  const rating = body.rating != null ? Number(body.rating) : undefined;
  if (rating != null && (rating < 1 || rating > 5 || !Number.isInteger(rating))) {
    return Response.json({ error: "rating must be 1–5" }, { status: 400 });
  }
  const privateFlag = body.privateFlag !== false;

  const order = await prisma.order.findFirst({
    where: { id: orderId, buyerId: user.id },
    select: { id: true, producerId: true },
  });
  if (!order) {
    return Response.json({ error: "Order not found or you are not the buyer" }, { status: 404 });
  }

  const existing = await prisma.review.findFirst({
    where: { orderId: order.id, reviewerId: user.id, type: "MARKET" },
  });
  if (existing) {
    return Response.json({ error: "You have already left a review for this order" }, { status: 400 });
  }

  try {
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
    return Response.json({ review: { id: review.id, privateFlag: review.privateFlag } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to submit review";
    return Response.json({ error: message }, { status: 400 });
  }
}
