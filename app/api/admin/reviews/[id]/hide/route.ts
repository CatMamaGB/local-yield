/**
 * POST /api/admin/reviews/[id]/hide — Admin: hide a review (moderation).
 */

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { hideReviewByAdmin, logReviewAdminAction } from "@/lib/reviews";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { mapAuthErrorToResponse } from "@/lib/auth/error-handler";
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

  let admin: { id: string };
  try {
    admin = await requireAdmin();
  } catch (e) {
    return mapAuthErrorToResponse(e, requestId);
  }
  const { id } = await params;
  if (!id) return fail("Missing review id", { code: "VALIDATION_ERROR", status: 400 });
  try {
    const review = await prisma.review.findUnique({
      where: { id },
      select: { hiddenByAdmin: true, flaggedForAdmin: true },
    });
    if (!review) return fail("Review not found", { code: "NOT_FOUND", status: 404 });
    await hideReviewByAdmin(id);
    await logReviewAdminAction(admin.id, "REVIEW_HIDE", id, {
      previousHidden: review.hiddenByAdmin,
      previousFlagged: review.flaggedForAdmin,
    });
    return ok(undefined);
  } catch (e) {
    logError("admin/reviews/[id]/hide/POST", e, { requestId, path: "/api/admin/reviews/[id]/hide", method: "POST" });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
