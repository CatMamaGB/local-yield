/**
 * POST /api/care/bookings
 * Creates a care booking request and conversation.
 * Auth required (getCurrentUser).
 */

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createCareBooking } from "@/lib/care";
import { CreateCareBookingSchema } from "@/lib/validators";
import { ok, fail, failStructured, parseJsonBody, withRequestId } from "@/lib/api";
import { logError } from "@/lib/logger";
import { logTelemetry } from "@/lib/telemetry/telemetry";
import type { CareBookingSubmittedEvent } from "@/lib/telemetry/events";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const requestId = withRequestId(request);
  const rateLimitRes = await checkRateLimit(request, undefined, requestId);
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Unauthorized", { code: "UNAUTHORIZED", status: 401, requestId });
    }

    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) return fail(parseError, { code: "INVALID_JSON", status: 400, requestId });

    // Get idempotency key from header or body
    const idempotencyKey = request.headers.get("Idempotency-Key") || body?.idempotencyKey;

    const validation = CreateCareBookingSchema.safeParse({
      ...body,
      idempotencyKey,
    });
    if (!validation.success) {
      const first = validation.error.issues[0];
      return fail(first?.message ?? "Invalid request", { code: "VALIDATION_ERROR", status: 400, requestId });
    }

    const { bookingId, conversationId } = await createCareBooking({
      seekerId: user.id,
      caregiverId: validation.data.caregiverId,
      startAt: new Date(validation.data.startAt),
      endAt: new Date(validation.data.endAt),
      locationZip: validation.data.locationZip,
      notes: validation.data.notes,
      species: validation.data.species,
      serviceType: validation.data.serviceType,
      idempotencyKey: validation.data.idempotencyKey,
    });

    // Log booking submitted event
    const telemetryEvent: CareBookingSubmittedEvent = {
      event: "care_booking_submitted",
      bookingId,
      caregiverId: validation.data.caregiverId,
      seekerId: user.id,
    };
    logTelemetry(telemetryEvent);

    return ok({ bookingId, conversationId }, requestId);
  } catch (error) {
    // Handle structured errors from createCareBooking
    if (error instanceof Error && error.message === "CAREGIVER_UNAVAILABLE") {
      return failStructured(
        { code: "CAREGIVER_UNAVAILABLE", message: "Caregiver is not available for the selected dates" },
        409,
        requestId
      );
    }
    if (error instanceof Error && error.message === "Caregiver not found") {
      return failStructured(
        { code: "CAREGIVER_NOT_FOUND", message: "Caregiver not found" },
        404,
        requestId
      );
    }
    logError("care/bookings/POST", error, { requestId, path: "/api/care/bookings", method: "POST" });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}

/**
 * GET /api/care/bookings
 * Returns bookings relevant to current user (as seeker and/or caregiver).
 */
export async function GET(request: NextRequest) {
  const requestId = withRequestId(request);
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Unauthorized", { code: "UNAUTHORIZED", status: 401, requestId });
    }

    const { getBookingsForUser } = await import("@/lib/care");
    const bookings = await getBookingsForUser(user.id);

    return ok({ bookings }, requestId);
  } catch (error) {
    logError("care/bookings/GET", error, {
      requestId,
      path: "/api/care/bookings",
      method: "GET",
    });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
