/**
 * POST /api/care/bookings/[id]/conversation
 * Get or create conversation for a booking.
 */

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateBookingConversation } from "@/lib/care";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { logError } from "@/lib/logger";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request, RATE_LIMIT_PRESETS.MESSAGES, requestId);
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", { code: "UNAUTHORIZED", status: 401 });

    const { id } = await params;
    if (!id) return fail("Booking ID required", { code: "VALIDATION_ERROR", status: 400 });

    const booking = await prisma.careBooking.findUnique({
      where: { id },
      select: { careSeekerId: true, caregiverId: true },
    });

    if (!booking) return fail("Booking not found", { code: "NOT_FOUND", status: 404 });
    if (booking.careSeekerId !== user.id && booking.caregiverId !== user.id) {
      return fail("Forbidden", { code: "FORBIDDEN", status: 403 });
    }

    const conversation = await getOrCreateBookingConversation({
      seekerId: booking.careSeekerId,
      caregiverId: booking.caregiverId,
      bookingId: id,
    });

    return ok({ conversationId: conversation.id });
  } catch (error) {
    logError("care/bookings/[id]/conversation/POST", error, { requestId, path: "/api/care/bookings/[id]/conversation", method: "POST" });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
