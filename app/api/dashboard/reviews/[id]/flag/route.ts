/**
 * POST /api/dashboard/reviews/[id]/flag — producer flags review for admin (unfair or unrelated).
 */

import { NextResponse } from "next/server";
import { requireProducerOrAdmin } from "@/lib/auth";
import { flagReviewByProducer } from "@/lib/reviews";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireProducerOrAdmin();
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing review id" }, { status: 400 });
    await flagReviewByProducer(id, user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json(
      { error: message },
      { status: e instanceof Error && e.message.includes("not found") ? 404 : 403 }
    );
  }
}
