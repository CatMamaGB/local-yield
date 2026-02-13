/**
 * API: set or clear producer's optional note for a buyer (Tier 2: Your customers).
 */

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setProducerCustomerNote } from "@/lib/customers";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";

export async function PATCH(request: NextRequest) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;

  const user = await getCurrentUser();
  if (!user || (user.role !== "PRODUCER" && user.role !== "ADMIN")) return fail("Forbidden", "FORBIDDEN", 403);

  const { data: body, error: parseError } = await parseJsonBody(request);
  if (parseError) return fail(parseError, "INVALID_JSON", 400);

  const buyerId = typeof body?.buyerId === "string" ? body.buyerId.trim() : null;
  const note = body?.note === undefined ? undefined : (body.note === null ? null : String(body.note).trim() || null);

  if (!buyerId) return fail("buyerId required", "VALIDATION_ERROR", 400);

  try {
    await setProducerCustomerNote(user.id, buyerId, note ?? null);
    return ok(undefined);
  } catch (e) {
    logError("dashboard/customers/note/PATCH", e, { requestId, path: "/api/dashboard/customers/note", method: "PATCH" });
    return fail("Something went wrong", "INTERNAL_ERROR", 500, { requestId });
  }
}
