/**
 * GET /api/orders/[id]/review — current buyer's review for this order (if any).
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getReviewByOrderForBuyer } from "@/lib/reviews";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: orderId } = await params;
  if (!orderId) return NextResponse.json({ error: "Missing order id" }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: { id: orderId, buyerId: user.id },
    select: { id: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const review = await getReviewByOrderForBuyer(user.id, orderId);
  if (!review) return NextResponse.json({ review: null });
  return NextResponse.json({
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
}
