/**
 * GET /api/dashboard/conversations — list conversations for current user (producer/buyer).
 * Returns other participant and last message for each.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
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

  return NextResponse.json({ conversations: list });
}
