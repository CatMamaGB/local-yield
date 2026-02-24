/**
 * GET /api/admin/bookings - List bookings with status filters (admin only)
 * Query params: status, limit
 */

import { NextRequest } from "next/server";
import type { CareBookingStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, withRequestId } from "@/lib/api";
import { logError } from "@/lib/logger";
import { AdminBookingsQuerySchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const requestId = withRequestId(request);
  try {
    await requireAdmin();
  } catch {
    return fail("Forbidden", { code: "FORBIDDEN", status: 403, requestId });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      status: searchParams.get("status") || undefined,
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
    };

    const validation = AdminBookingsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      const first = validation.error.issues[0];
      return fail(first?.message ?? "Invalid query parameters", {
        code: "VALIDATION_ERROR",
        status: 400,
        requestId,
      });
    }

    const status = validation.data.status;
    const page = validation.data.page ?? 1;
    const pageSize = validation.data.pageSize ?? 50;
    const skip = (page - 1) * pageSize;

    const where = { ...(status && { status: status as CareBookingStatus }) };

    const [bookings, total] = await Promise.all([
      prisma.careBooking.findMany({
        where,
        include: {
          careSeeker: { select: { id: true, name: true, email: true } },
          caregiver: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.careBooking.count({ where }),
    ]);

    return ok({ items: bookings, page, pageSize, total, bookings }, requestId);
  } catch (error) {
    logError("admin/bookings/GET", error, {
      requestId,
      path: "/api/admin/bookings",
      method: "GET",
    });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
