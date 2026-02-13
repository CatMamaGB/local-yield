/**
 * GET /api/dashboard/conversations — list conversations for current user (producer/buyer).
 * Returns other participant and last message for each.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { logError } from "@/lib/logger";
import { getRequestId } from "@/lib/request-id";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  try {
    const user = await requireAuth();
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ userAId: user.id }, { userBId: user.id }],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        userA: { select: { id: true, name: true, email: true } },
        userB: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { body: true, createdAt: true, senderId: true },
        },
      },
    });

    const list = conversations.map((c) => {
      const other = c.userAId === user.id ? c.userB : c.userA;
      const lastMessage = c.messages[0];
      return {
        id: c.id,
        other: { id: other.id, name: other.name, email: other.email },
        orderId: c.orderId,
        lastMessage: lastMessage
          ? {
              body: lastMessage.body,
              createdAt: lastMessage.createdAt.toISOString(),
              fromMe: lastMessage.senderId === user.id,
            }
          : null,
        updatedAt: c.updatedAt.toISOString(),
      };
    });

    return ok({ conversations: list });
  } catch (e) {
    logError("dashboard/conversations/GET", e, { requestId, path: "/api/dashboard/conversations", method: "GET" });
    return fail("Forbidden", "FORBIDDEN", 403);
  }
}
