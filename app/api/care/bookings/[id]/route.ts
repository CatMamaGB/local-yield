/**
 * GET /api/care/bookings/[id] — booking detail for participant or admin.
 * PATCH /api/care/bookings/[id] — update status (Accept/Decline/Cancel).
 */

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getBookingByIdForUser, updateCareBookingStatus } from "@/lib/care";
import { UpdateCareBookingStatusSchema } from "@/lib/validators";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", { code: "UNAUTHORIZED", status: 401 });

    const { id } = await params;
    const booking = await getBookingByIdForUser(id, user.id, user.role === "ADMIN");
    if (!booking) return fail("Booking not found", { code: "NOT_FOUND", status: 404, requestId });

    return ok({
      id: booking.id,
      status: booking.status,
      startAt: booking.startAt.toISOString(),
      endAt: booking.endAt.toISOString(),
      locationZip: booking.locationZip,
      notes: booking.notes,
      species: booking.species,
      serviceType: booking.serviceType,
      careSeeker: booking.careSeeker,
      caregiver: booking.caregiver,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
      isCaregiver: booking.caregiverId === user.id,
      isSeeker: booking.careSeekerId === user.id,
    });
  } catch (e) {
    logError("care/bookings/[id]/GET", e, { requestId, path: "/api/care/bookings/[id]", method: "GET" });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request, undefined, requestId);
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", { code: "UNAUTHORIZED", status: 401 });

    const { id } = await params;
    if (!id) return fail("Booking ID required", { code: "VALIDATION_ERROR", status: 400 });

    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) return fail(parseError, { code: "INVALID_JSON", status: 400 });

    const validation = UpdateCareBookingStatusSchema.safeParse(body);
    if (!validation.success) {
      const first = validation.error.issues[0];
      return fail(first?.message ?? "Invalid request", { code: "VALIDATION_ERROR", status: 400 });
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
      return fail(message || "Forbidden", { code: "FORBIDDEN", status: 403 });
    }
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
