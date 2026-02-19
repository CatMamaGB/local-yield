/**
 * PATCH /api/reviews/[id] — buyer updates their own review (comment/rating). Only while still private.
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateReviewByReviewer } from "@/lib/reviews";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request, undefined, requestId);
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await requireAuth();
    const { id } = await params;
    if (!id) return fail("Missing review id", { code: "VALIDATION_ERROR", status: 400 });

    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) return fail(parseError, { code: "INVALID_JSON", status: 400 });

    const comment = body?.comment !== undefined ? String(body.comment).trim() : undefined;
    const rating = body?.rating !== undefined ? Number(body.rating) : undefined;
    if (rating != null && (rating < 1 || rating > 5 || !Number.isInteger(rating))) return fail("rating must be 1–5", { code: "VALIDATION_ERROR", status: 400 });
    if (comment === undefined && rating === undefined) return fail("comment or rating required", { code: "VALIDATION_ERROR", status: 400 });

    await updateReviewByReviewer(id, user.id, { comment, rating });
    return ok(undefined);
  } catch (e) {
    logError("reviews/[id]/PATCH", e, { requestId, path: "/api/reviews/[id]", method: "PATCH" });
    const message = e instanceof Error ? e.message : "";
    if (message === "Forbidden") return fail(message, { code: "FORBIDDEN", status: 403 });
    if (message.includes("not found")) return fail("Review not found", { code: "NOT_FOUND", status: 404 });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
