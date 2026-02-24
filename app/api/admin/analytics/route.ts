/**
 * GET /api/admin/analytics - Platform-wide metrics (admin only)
 * Returns: totalUsers, totalOrders, gmvCents, totalBookings, reportsPending
 */

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, withRequestId } from "@/lib/api";

export async function GET(request: NextRequest) {
  const requestId = withRequestId(request);
  try {
    await requireAdmin();
  } catch {
    return fail("Forbidden", { code: "FORBIDDEN", status: 403, requestId });
  }

  try {
    const [totalUsers, orderStats, totalBookings, reportsPending] = await Promise.all([
      prisma.user.count(),
      prisma.order.aggregate({
        _count: { id: true },
        _sum: { totalCents: true },
        where: {
          OR: [{ paid: true }, { status: { in: ["PAID", "FULFILLED"] } }],
        },
      }),
      prisma.careBooking.count(),
      prisma.report.count({ where: { status: "PENDING" } }),
    ]);

    const totalOrders = orderStats._count.id ?? 0;
    const gmvCents = orderStats._sum.totalCents ?? 0;

    return ok(
      {
        totalUsers,
        totalOrders,
        gmvCents,
        totalBookings,
        reportsPending,
      },
      requestId
    );
  } catch {
    return fail("Failed to load analytics", {
      code: "INTERNAL_ERROR",
      status: 500,
      requestId,
    });
  }
}
