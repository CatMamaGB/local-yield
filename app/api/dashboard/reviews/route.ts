/**
 * GET /api/dashboard/reviews — list pending reviews for current producer (private, not yet approved).
 */

import { NextResponse } from "next/server";
import { requireProducerOrAdmin } from "@/lib/auth";
import { getPendingReviewsForProducer } from "@/lib/reviews";

export async function GET() {
  try {
    const user = await requireProducerOrAdmin();
    const reviews = await getPendingReviewsForProducer(user.id);
    return NextResponse.json({
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
    const message = e instanceof Error ? e.message : "Forbidden";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
