/**
 * Shared messaging: Buyer↔Producer (Market), Owner↔Caregiver (Care).
 * One conversation per (userA, userB) with optional orderId or careBookingId.
 * Build cleanly once; reuse for both surfaces.
 */

import { prisma } from "./prisma";

/** Normalize so userAId < userBId for consistent lookup (optional; or use findFirst with OR). */
function orderedUserIds(userAId: string, userBId: string): [string, string] {
  return userAId < userBId ? [userAId, userBId] : [userBId, userAId];
}

export interface CreateConversationInput {
  userAId: string;
  userBId: string;
  orderId?: string;
  careBookingId?: string;
}

/**
 * Find or create a conversation between two users, optionally scoped to an order or care booking.
 */
export async function getOrCreateConversation(input: CreateConversationInput) {
  const [id1, id2] = orderedUserIds(input.userAId, input.userBId);
  const existing = await prisma.conversation.findFirst({
    where: {
      OR: [
        { userAId: id1, userBId: id2, orderId: input.orderId ?? null, careBookingId: input.careBookingId ?? null },
        { userAId: id2, userBId: id1, orderId: input.orderId ?? null, careBookingId: input.careBookingId ?? null },
      ],
    },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (existing) return existing;
  return prisma.conversation.create({
    data: {
      userAId: id1,
      userBId: id2,
      orderId: input.orderId ?? undefined,
      careBookingId: input.careBookingId ?? undefined,
    },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
}

export async function getConversationById(conversationId: string, userId: string) {
  const conv = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    include: {
      messages: { orderBy: { createdAt: "asc" }, include: { sender: { select: { id: true, name: true } } } },
      userA: { select: { id: true, name: true } },
      userB: { select: { id: true, name: true } },
    },
  });
  return conv;
}

/** List conversations for a user (e.g. inbox). */
export async function listConversationsForUser(userId: string) {
  return prisma.conversation.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    include: {
      messages: { take: 1, orderBy: { createdAt: "desc" } },
      userA: { select: { id: true, name: true } },
      userB: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export interface SendMessageInput {
  conversationId: string;
  senderId: string;
  body: string;
}

export async function sendMessage(input: SendMessageInput) {
  const conv = await prisma.conversation.findFirst({
    where: {
      id: input.conversationId,
      OR: [{ userAId: input.senderId }, { userBId: input.senderId }],
    },
  });
  if (!conv) throw new Error("Conversation not found");
  return prisma.message.create({
    data: {
      conversationId: input.conversationId,
      senderId: input.senderId,
      body: input.body,
    },
    include: { sender: { select: { id: true, name: true } } },
  });
}
