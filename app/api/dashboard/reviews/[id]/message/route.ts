/**
 * POST /api/dashboard/reviews/[id]/message — get or create conversation with reviewer for this review.
 * Returns conversationId so producer can open the private chat. Order is linked when available.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProducerOrAdmin } from "@/lib/auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireProducerOrAdmin();
    const { id: reviewId } = await params;
    if (!reviewId) return NextResponse.json({ error: "Missing review id" }, { status: 400 });

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { revieweeId: true, reviewerId: true, orderId: true },
    });
    if (!review || review.revieweeId !== user.id) {
      return NextResponse.json({ error: "Review not found or you are not the producer." }, { status: 404 });
    }

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

    return NextResponse.json({ conversationId: conversation.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
