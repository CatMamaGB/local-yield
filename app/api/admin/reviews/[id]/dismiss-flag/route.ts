/**
 * POST /api/admin/reviews/[id]/dismiss-flag — Admin: dismiss producer's flag (review stays as-is).
 */

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { dismissFlagByAdmin, logReviewAdminAction } from "@/lib/reviews";
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

  let admin: { id: string };
  try {
    admin = await requireAdmin();
  } catch {
    return fail("Forbidden", { code: "FORBIDDEN", status: 403 });
  }
  const { id } = await params;
  if (!id) return fail("Missing review id", { code: "VALIDATION_ERROR", status: 400 });
  try {
    await dismissFlagByAdmin(id);
    await logReviewAdminAction(admin.id, "REVIEW_DISMISS_FLAG", id, {});
    return ok(undefined);
  } catch (e) {
    logError("admin/reviews/[id]/dismiss-flag/POST", e, { requestId, path: "/api/admin/reviews/[id]/dismiss-flag", method: "POST" });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
