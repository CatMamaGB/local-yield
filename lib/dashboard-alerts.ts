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
 * - Unread messages: TODO - not yet implemented, returns 0
 */
export async function getProducerAlertCounts(userId: string): Promise<ProducerAlertCounts> {
  const [pendingOrdersCount, pendingReviewsCount] = await Promise.all([
    // Orders needing action: PENDING (awaiting payment) or PAID (awaiting fulfillment)
    prisma.order.count({
      where: {
        producerId: userId,
        status: {
          in: ["PENDING", "PAID"],
        },
      },
    }),
    
    // Reviews to approve: private reviews for this producer
    prisma.review.count({
      where: {
        revieweeId: userId,
        privateFlag: true,
        hiddenByAdmin: false,
      },
    }),
  ]);

  // TODO: Implement unread message tracking
  const unreadMessagesCount = 0;

  return {
    pendingOrdersCount,
    pendingReviewsCount,
    unreadMessagesCount,
  };
}
