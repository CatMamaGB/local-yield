/**
 * POST /api/care/bookings
 * Creates a care booking request and conversation.
 * Auth required (getCurrentUser).
 */

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createCareBooking } from "@/lib/care";
import { CreateCareBookingSchema } from "@/lib/validators";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) return fail(parseError, "INVALID_JSON", 400);

    const validation = CreateCareBookingSchema.safeParse(body);
    if (!validation.success) {
      const first = validation.error.issues[0];
      return fail(first?.message ?? "Invalid request", "VALIDATION_ERROR", 400);
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
    });

    return ok({ bookingId, conversationId });
  } catch (error) {
    logError("care/bookings/POST", error, { requestId, path: "/api/care/bookings", method: "POST" });
    return fail("Something went wrong", "INTERNAL_ERROR", 500, { requestId });
  }
}

/**
 * GET /api/care/bookings
 * Returns bookings relevant to current user (as seeker and/or caregiver).
 */
export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Unauthorized", "UNAUTHORIZED", 401);
    }

    const { getBookingsForUser } = await import("@/lib/care");
    const bookings = await getBookingsForUser(user.id);

    return ok({ bookings });
  } catch (error) {
    logError("care/bookings/GET", error, { requestId, path: "/api/care/bookings", method: "GET" });
    return fail("Something went wrong", "INTERNAL_ERROR", 500, { requestId });
  }
}
