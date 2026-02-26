/**
 * POST /api/admin/reviews/[id]/approve-flag — Admin: approve flagged review (clear flag, make public).
 */

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { approveFlaggedReviewByAdmin, logReviewAdminAction } from "@/lib/reviews";
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
    await approveFlaggedReviewByAdmin(id);
    await logReviewAdminAction(admin.id, "REVIEW_APPROVE_FLAG", id, {});
    return ok(undefined);
  } catch (e) {
    logError("admin/reviews/[id]/approve-flag/POST", e, { requestId, path: "/api/admin/reviews/[id]/approve-flag", method: "POST" });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
