/**
 * POST /api/dashboard/reviews/[id]/approve — producer approves review (makes it public).
 */

import { NextRequest } from "next/server";
import { requireProducerOrAdmin } from "@/lib/auth";
import { approveReviewByProducer } from "@/lib/reviews";
import { ok, fail } from "@/lib/api";
import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await requireProducerOrAdmin();
    const { id } = await params;
    if (!id) return fail("Missing review id", "VALIDATION_ERROR", 400);
    await approveReviewByProducer(id, user.id);
    return ok(undefined);
  } catch (e) {
    logError("dashboard/reviews/[id]/approve/POST", e, { requestId, path: "/api/dashboard/reviews/[id]/approve", method: "POST" });
    const message = e instanceof Error ? e.message : "";
    if (message === "Forbidden") return fail(message, "FORBIDDEN", 403);
    if (message.includes("not found")) return fail("Review not found", "NOT_FOUND", 404);
    return fail("Something went wrong", "INTERNAL_ERROR", 500, { requestId });
  }
}
