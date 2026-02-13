/**
 * PATCH /api/care/bookings/[id]
 * Update booking status (caregiver: ACCEPT/DECLINE, seeker: CANCEL).
 * Auth required.
 */

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateCareBookingStatus } from "@/lib/care";
import { UpdateCareBookingStatusSchema } from "@/lib/validators";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", "UNAUTHORIZED", 401);

    const { id } = await params;
    if (!id) return fail("Booking ID required", "VALIDATION_ERROR", 400);

    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) return fail(parseError, "INVALID_JSON", 400);

    const validation = UpdateCareBookingStatusSchema.safeParse(body);
    if (!validation.success) {
      const first = validation.error.issues[0];
      return fail(first?.message ?? "Invalid request", "VALIDATION_ERROR", 400);
    }

    const booking = await updateCareBookingStatus({
      actorId: user.id,
      bookingId: id,
      newStatus: validation.data.status,
    });

    return ok({ booking });
  } catch (error) {
    logError("care/bookings/[id]/PATCH", error, { requestId, path: "/api/care/bookings/[id]", method: "PATCH" });
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Unauthorized") || message.includes("not found")) {
      return fail(message || "Forbidden", "FORBIDDEN", 403);
    }
    return fail("Something went wrong", "INTERNAL_ERROR", 500, { requestId });
  }
}
