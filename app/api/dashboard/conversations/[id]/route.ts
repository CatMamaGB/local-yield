/**
 * GET /api/dashboard/conversations/[id] — get single conversation with full message thread.
 * Marks conversation as read for the current user.
 */

import { NextRequest } from "next/server";
import { getConversationById, markConversationAsRead } from "@/lib/messaging";
import { requireAuth } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { logError } from "@/lib/logger";
import { getRequestId } from "@/lib/request-id";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  try {
    const user = await requireAuth();
    const { id: conversationId } = await params;
    if (!conversationId) {
      return fail("Conversation ID required", { code: "VALIDATION_ERROR", status: 400, requestId });
    }

    const conv = await getConversationById(conversationId, user.id);
    if (!conv) {
      return fail("Conversation not found", { code: "NOT_FOUND", status: 404, requestId });
    }

    await markConversationAsRead(conversationId, user.id);

    const other = conv.userAId === user.id ? conv.userB : conv.userA;
    const messages = conv.messages.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      fromMe: m.senderId === user.id,
      senderName: m.sender.name ?? null,
    }));

    return ok({
      id: conv.id,
      orderId: conv.orderId,
      careBookingId: conv.careBookingId,
      other: { id: other.id, name: other.name },
      messages,
      updatedAt: conv.updatedAt.toISOString(),
    });
  } catch (e) {
    logError("dashboard/conversations/[id]/GET", e, {
      requestId,
      path: "/api/dashboard/conversations/[id]",
      method: "GET",
    });
    return fail("Forbidden", { code: "FORBIDDEN", status: 403, requestId });
  }
}
