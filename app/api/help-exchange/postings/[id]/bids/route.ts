/**
 * POST /api/help-exchange/postings/[id]/bids — place a bid (apply) on a posting.
 * GET /api/help-exchange/postings/[id]/bids — list bids for this posting (poster only).
 */

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { logError } from "@/lib/logger";
import { getRequestId } from "@/lib/request-id";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", { code: "UNAUTHORIZED", status: 401, requestId });

    const { id: postingId } = await params;
    const posting = await prisma.helpExchangePosting.findUnique({
      where: { id: postingId },
      select: { id: true, createdById: true, status: true },
    });

    if (!posting) return fail("Posting not found", { code: "NOT_FOUND", status: 404, requestId });
    if (posting.createdById === user.id) return fail("You cannot bid on your own posting", { code: "VALIDATION_ERROR", status: 400, requestId });
    if (posting.status !== "OPEN") return fail("Posting is no longer open for bids", { code: "VALIDATION_ERROR", status: 400, requestId });

    const { data: body } = await parseJsonBody(request);
    const message = typeof body?.message === "string" ? body.message.trim().slice(0, 2000) : null;

    const existing = await prisma.helpExchangeBid.findUnique({
      where: { postingId_bidderId: { postingId, bidderId: user.id } },
    });
    if (existing) return fail("You have already applied to this posting", { code: "VALIDATION_ERROR", status: 400, requestId });

    const bid = await prisma.helpExchangeBid.create({
      data: {
        postingId,
        bidderId: user.id,
        message: message || null,
        status: "PENDING",
      },
      include: {
        bidder: { select: { id: true, name: true } },
        posting: { select: { id: true, title: true } },
      },
    });

    return ok(
      {
        bid: {
          id: bid.id,
          status: bid.status,
          message: bid.message,
          createdAt: bid.createdAt.toISOString(),
          posting: bid.posting,
        },
      },
      requestId
    );
  } catch (e) {
    logError("help-exchange/postings/[id]/bids/POST", e, { requestId, path: "/api/help-exchange/postings/[id]/bids", method: "POST" });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", { code: "UNAUTHORIZED", status: 401, requestId });

    const { id: postingId } = await params;
    const posting = await prisma.helpExchangePosting.findUnique({
      where: { id: postingId },
      select: { id: true, createdById: true },
    });

    if (!posting) return fail("Posting not found", { code: "NOT_FOUND", status: 404, requestId });
    if (posting.createdById !== user.id) return fail("Forbidden", { code: "FORBIDDEN", status: 403, requestId });

    const bids = await prisma.helpExchangeBid.findMany({
      where: { postingId },
      include: { bidder: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return ok({
      bids: bids.map((b) => ({
        id: b.id,
        message: b.message,
        status: b.status,
        createdAt: b.createdAt.toISOString(),
        bidder: b.bidder,
      })),
    }, requestId);
  } catch (e) {
    logError("help-exchange/postings/[id]/bids/GET", e, { requestId, path: "/api/help-exchange/postings/[id]/bids", method: "GET" });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
