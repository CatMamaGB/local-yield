/**
 * PATCH /api/admin/reviews/[id]/guidance — Admin: set guidance text for producer/buyer.
 * Body: { guidance: string | null }
 */

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { setAdminGuidance, logReviewAdminAction } from "@/lib/reviews";
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

  let admin: { id: string };
  try {
    admin = await requireAdmin();
  } catch {
    return fail("Forbidden", { code: "FORBIDDEN", status: 403 });
  }
  const { id } = await params;
  if (!id) return fail("Missing review id", { code: "VALIDATION_ERROR", status: 400 });
  const { data: body, error: parseError } = await parseJsonBody(request);
  if (parseError) return fail(parseError, { code: "INVALID_JSON", status: 400 });
  const guidance = body?.guidance === undefined ? null : (body?.guidance ?? null);
  try {
    await setAdminGuidance(id, typeof guidance === "string" ? guidance : null);
    await logReviewAdminAction(admin.id, "REVIEW_GUIDANCE", id, {
      guidance: typeof guidance === "string" ? guidance : null,
    });
    return ok(undefined);
  } catch (e) {
    logError("admin/reviews/[id]/guidance/PATCH", e, { requestId, path: "/api/admin/reviews/[id]/guidance", method: "PATCH" });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
