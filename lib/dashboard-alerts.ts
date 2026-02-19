/**
 * Dashboard alert counts for producers: pending orders, reviews, messages.
 * Used to show badges and alert cards.
 */

import { prisma } from "./prisma";

export interface ProducerAlertCounts {
  pendingOrdersCount: number;
  pendingReviewsCount: number;
  unreadMessagesCount: number;
}

/**
 * Get alert counts for a producer's dashboard.
 * - Pending orders: orders not yet fulfilled/canceled/refunded
 * - Pending reviews: private reviews awaiting approval
 * - Unread messages: messages in user's conversations where sender != user and message is after user's lastReadAt
 */
export async function getProducerAlertCounts(userId: string): Promise<ProducerAlertCounts> {
  const [pendingOrdersCount, pendingReviewsCount, unreadMessagesCount] = await Promise.all([
    prisma.order.count({
      where: {
        producerId: userId,
        status: { in: ["PENDING", "PAID"] },
      },
    }),
    prisma.review.count({
      where: {
        revieweeId: userId,
        privateFlag: true,
        hiddenByAdmin: false,
      },
    }),
    (async () => {
      const convos = await prisma.conversation.findMany({
        where: { OR: [{ userAId: userId }, { userBId: userId }] },
        select: {
          id: true,
          userAId: true,
          userBId: true,
          userALastReadAt: true,
          userBLastReadAt: true,
          messages: {
            where: { senderId: { not: userId } },
            select: { createdAt: true },
          },
        },
      });
      let count = 0;
      for (const c of convos) {
        const lastRead = c.userAId === userId ? c.userALastReadAt : c.userBLastReadAt;
        for (const m of c.messages) {
          if (!lastRead || m.createdAt > lastRead) count++;
        }
      }
      return count;
    })(),
  ]);

  return {
    pendingOrdersCount,
    pendingReviewsCount,
    unreadMessagesCount,
  };
}
