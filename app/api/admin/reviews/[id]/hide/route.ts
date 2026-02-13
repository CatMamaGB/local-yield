/**
 * POST /api/admin/reviews/[id]/hide — Admin: hide a review (moderation).
 */

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { hideReviewByAdmin, logReviewAdminAction } from "@/lib/reviews";
import { prisma } from "@/lib/prisma";
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

  let admin: { id: string };
  try {
    admin = await requireAdmin();
  } catch {
    return fail("Forbidden", "FORBIDDEN", 403);
  }
  const { id } = await params;
  if (!id) return fail("Missing review id", "VALIDATION_ERROR", 400);
  try {
    const review = await prisma.review.findUnique({
      where: { id },
      select: { hiddenByAdmin: true, flaggedForAdmin: true },
    });
    if (!review) return fail("Review not found", "NOT_FOUND", 404);
    await hideReviewByAdmin(id);
    await logReviewAdminAction(admin.id, "REVIEW_HIDE", id, {
      previousHidden: review.hiddenByAdmin,
      previousFlagged: review.flaggedForAdmin,
    });
    return ok(undefined);
  } catch (e) {
    logError("admin/reviews/[id]/hide/POST", e, { requestId, path: "/api/admin/reviews/[id]/hide", method: "POST" });
    return fail("Something went wrong", "INTERNAL_ERROR", 500, { requestId });
  }
}
