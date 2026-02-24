/**
 * GET /api/admin/help-exchange - List help exchange postings (admin only)
 * Query params: status, category, limit
 */

import { NextRequest } from "next/server";
import type { HelpExchangeCategory, HelpExchangeStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, withRequestId } from "@/lib/api";
import { logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const requestId = withRequestId(request);
  try {
    await requireAdmin();
  } catch {
    return fail("Forbidden", { code: "FORBIDDEN", status: 403, requestId });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50));

    const postings = await prisma.helpExchangePosting.findMany({
      where: {
        ...(status && { status: status as HelpExchangeStatus }),
        ...(category && { category: category as HelpExchangeCategory }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return ok({ postings }, requestId);
  } catch (error) {
    logError("admin/help-exchange/GET", error, {
      requestId,
      path: "/api/admin/help-exchange",
      method: "GET",
    });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
