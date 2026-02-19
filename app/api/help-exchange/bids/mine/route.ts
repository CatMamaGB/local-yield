/**
 * GET /api/help-exchange/bids/mine — list bids placed by the current user.
 */

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { logError } from "@/lib/logger";
import { getRequestId } from "@/lib/request-id";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", { code: "UNAUTHORIZED", status: 401, requestId });

    const bids = await prisma.helpExchangeBid.findMany({
      where: { bidderId: user.id },
      include: {
        posting: {
          select: {
            id: true,
            title: true,
            category: true,
            zipCode: true,
            status: true,
            createdBy: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok({
      bids: bids.map((b) => ({
        id: b.id,
        message: b.message,
        status: b.status,
        createdAt: b.createdAt.toISOString(),
        posting: b.posting,
      })),
    }, requestId);
  } catch (e) {
    logError("help-exchange/bids/mine/GET", e, { requestId, path: "/api/help-exchange/bids/mine", method: "GET" });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
