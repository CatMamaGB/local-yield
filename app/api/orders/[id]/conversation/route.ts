/**
 * POST /api/orders/[id]/conversation — get or create conversation for this order (buyer ↔ producer).
 * Buyer only. Returns conversationId for redirect to messages.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getOrCreateConversation } from "@/lib/messaging";
import { ok, fail } from "@/lib/api";
import { logError } from "@/lib/logger";
import { getRequestId } from "@/lib/request-id";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  try {
    const user = await requireAuth();
    const { id: orderId } = await params;
    if (!orderId) {
      return fail("Order ID required", { code: "VALIDATION_ERROR", status: 400, requestId });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, buyerId: true, producerId: true },
    });

    if (!order) {
      return fail("Order not found", { code: "NOT_FOUND", status: 404, requestId });
    }
    if (order.buyerId !== user.id) {
      return fail("Forbidden", { code: "FORBIDDEN", status: 403, requestId });
    }

    const conversation = await getOrCreateConversation({
      userAId: order.buyerId,
      userBId: order.producerId,
      orderId: order.id,
    });

    return ok({ conversationId: conversation.id }, requestId);
  } catch (e) {
    logError("orders/[id]/conversation/POST", e, {
      requestId,
      path: "/api/orders/[id]/conversation",
      method: "POST",
    });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
