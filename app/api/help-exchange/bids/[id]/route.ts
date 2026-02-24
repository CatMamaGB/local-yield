/**
 * PATCH /api/help-exchange/bids/[id] — accept or decline a bid (posting creator only).
 */

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request, undefined, requestId);
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", { code: "UNAUTHORIZED", status: 401, requestId });

    const { id: bidId } = await params;
    const bid = await prisma.helpExchangeBid.findUnique({
      where: { id: bidId },
      include: {
        posting: { select: { id: true, createdById: true, title: true } },
      },
    });

    if (!bid) return fail("Bid not found", { code: "NOT_FOUND", status: 404, requestId });
    if (bid.posting.createdById !== user.id) return fail("Forbidden", { code: "FORBIDDEN", status: 403, requestId });
    if (bid.status !== "PENDING") return fail("Bid is no longer pending", { code: "VALIDATION_ERROR", status: 400, requestId });

    const { data: body } = await parseJsonBody(request);
    const status = body?.status === "ACCEPTED" || body?.status === "DECLINED" ? body.status : null;
    if (!status) return fail("status must be ACCEPTED or DECLINED", { code: "VALIDATION_ERROR", status: 400, requestId });

    const updated = await prisma.helpExchangeBid.update({
      where: { id: bidId },
      data: { status },
    });

    return ok({ bid: { id: updated.id, status: updated.status } }, requestId);
  } catch (e) {
    logError("help-exchange/bids/[id]/PATCH", e, { requestId, path: "/api/help-exchange/bids/[id]", method: "PATCH" });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
