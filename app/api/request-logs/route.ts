/**
 * GET /api/request-logs - View request logs (admin only).
 * For pagination and richer filters (since, method, statusMin/Max, includeIp), use GET /api/admin/request-logs.
 * Query params: limit, route, statusCode, userId
 */

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, withRequestId } from "@/lib/api";
import { mapAuthErrorToResponse } from "@/lib/auth/error-handler";
import { logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const requestId = withRequestId(request);
  try {
    await requireAdmin();
  } catch (e) {
    return mapAuthErrorToResponse(e, requestId);
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get("limit") ?? "100", 10) || 100));
    const route = searchParams.get("route");
    const statusCode = searchParams.get("statusCode") ? parseInt(searchParams.get("statusCode")!, 10) : undefined;
    const userId = searchParams.get("userId");

    const logs = await prisma.requestLog.findMany({
      where: {
        ...(route && { route: { contains: route } }),
        ...(statusCode && { statusCode }),
        ...(userId && { userId }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return ok({ logs }, requestId);
  } catch (error) {
    logError("request-logs/GET", error, {
      requestId,
      path: "/api/request-logs",
      method: "GET",
    });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
