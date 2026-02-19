/**
 * GET /api/dashboard/notifications - List in-app notifications for current user.
 * Query: page, pageSize, read (true|false to filter)
 */

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, withRequestId } from "@/lib/api";
import { logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const requestId = withRequestId(request);
  const user = await getCurrentUser();
  if (!user) {
    return fail("Unauthorized", { code: "UNAUTHORIZED", status: 401, requestId });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));
  const readFilter = searchParams.get("read");
  const read = readFilter === "true" ? true : readFilter === "false" ? false : undefined;

  try {
    const where = { userId: user.id, ...(read !== undefined && { read }) };
    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: user.id, read: false } }),
    ]);

    return ok(
      {
        items,
        page,
        pageSize,
        total,
        unreadCount,
      },
      requestId
    );
  } catch (error) {
    logError("dashboard/notifications/GET", error, {
      requestId,
      path: "/api/dashboard/notifications",
      method: "GET",
    });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
