/**
 * PATCH /api/reviews/[id] — buyer updates their own review (comment/rating). Only while still private.
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateReviewByReviewer } from "@/lib/reviews";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  if (!id) return Response.json({ error: "Missing review id" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const comment = body.comment !== undefined ? String(body.comment).trim() : undefined;
  const rating = body.rating !== undefined ? Number(body.rating) : undefined;
  if (rating != null && (rating < 1 || rating > 5 || !Number.isInteger(rating))) {
    return Response.json({ error: "rating must be 1–5" }, { status: 400 });
  }
  if (comment === undefined && rating === undefined) {
    return Response.json({ error: "comment or rating required" }, { status: 400 });
  }

  try {
    await updateReviewByReviewer(id, user.id, { comment, rating });
    return Response.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update review";
    return Response.json(
      { error: message },
      { status: e instanceof Error && e.message.includes("not found") ? 404 : 400 }
    );
  }
}
