/**
 * POST /api/dashboard/reviews/[id]/flag — producer flags review for admin (unfair or unrelated).
 */

import { NextRequest } from "next/server";
import { requireProducerOrAdmin } from "@/lib/auth";
import { flagReviewByProducer } from "@/lib/reviews";
import { ok, fail } from "@/lib/api";
import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request, undefined, requestId);
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await requireProducerOrAdmin();
    const { id } = await params;
    if (!id) return fail("Missing review id", { code: "VALIDATION_ERROR", status: 400 });
    await flagReviewByProducer(id, user.id);
    return ok(undefined);
  } catch (e) {
    logError("dashboard/reviews/[id]/flag/POST", e, { requestId, path: "/api/dashboard/reviews/[id]/flag", method: "POST" });
    const message = e instanceof Error ? e.message : "";
    if (message === "Forbidden") return fail(message, { code: "FORBIDDEN", status: 403 });
    if (message.includes("not found")) return fail("Review not found", { code: "NOT_FOUND", status: 404 });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
