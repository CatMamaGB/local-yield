/**
 * Kind feedback / internal review system for The Local Yield.
 * Private complaint–resolve flow between buyer and producer.
 */

import { prisma } from "./prisma";

export interface CreateReviewInput {
  reviewerId: string;
  producerId: string;
  orderId: string;
  comment: string;
  privateFlag?: boolean;
}

export async function createReview(input: CreateReviewInput) {
  return prisma.review.create({
    data: {
      reviewerId: input.reviewerId,
      producerId: input.producerId,
      orderId: input.orderId,
      comment: input.comment,
      privateFlag: input.privateFlag ?? true,
    },
  });
}

export async function getReviewsForOrder(orderId: string) {
  return prisma.review.findMany({
    where: { orderId },
    include: {
      reviewer: { select: { id: true, name: true, email: true } },
      producer: { select: { id: true, name: true } },
    },
  });
}

export async function getReviewsForProducer(producerId: string, resolved?: boolean) {
  return prisma.review.findMany({
    where: { producerId, ...(resolved != null ? { resolved } : {}) },
    include: {
      reviewer: { select: { id: true, name: true } },
      order: { select: { id: true, productId: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function resolveReview(reviewId: string) {
  return prisma.review.update({
    where: { id: reviewId },
    data: { resolved: true },
  });
}
