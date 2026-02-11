/**
 * Trust & kindness system: resolution window, structured reviews, producer response, admin moderation.
 * Buyer cannot publish negative public review until resolution window passes; producers can respond.
 */

import { prisma } from "./prisma";

/** Rating at or below this is considered "negative" for resolution-window gating. */
const NEGATIVE_RATING_THRESHOLD = 2;

/** Whether the resolution window has passed for this order (or there is none). */
export async function canPublishNegativePublicReview(orderId: string): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { resolutionWindowEndsAt: true },
  });
  if (!order?.resolutionWindowEndsAt) return true;
  return new Date() >= order.resolutionWindowEndsAt;
}

export interface CreateReviewInput {
  reviewerId: string;
  /** Who is being reviewed (producer for market, caregiver/owner for care). */
  revieweeId: string;
  /** For backward compat; defaults to revieweeId for MARKET. */
  producerId?: string;
  type?: "MARKET" | "CARE";
  orderId?: string | null;
  careBookingId?: string | null;
  comment: string;
  privateFlag?: boolean;
  /** Structured rating 1–5 for public display (short + structured). */
  rating?: number;
}

/** Create a review. Prevents self-review. Blocks negative public reviews until resolution window has passed. */
export async function createReview(input: CreateReviewInput) {
  if (input.reviewerId === input.revieweeId) {
    throw new Error("You cannot review yourself.");
  }
  const isPublic = input.privateFlag === false;
  const isNegative = input.rating != null && input.rating <= NEGATIVE_RATING_THRESHOLD;
  const orderId = input.orderId ?? undefined;
  if (isPublic && isNegative && orderId) {
    const allowed = await canPublishNegativePublicReview(orderId);
    if (!allowed) {
      throw new Error(
        "You can’t publish a negative public review until the resolution window has passed. Try again later or leave a private message to the producer."
      );
    }
  }
  const producerId = input.producerId ?? input.revieweeId;
  return prisma.review.create({
    data: {
      reviewerId: input.reviewerId,
      revieweeId: input.revieweeId,
      producerId,
      type: input.type ?? "MARKET",
      orderId: orderId ?? null,
      careBookingId: input.careBookingId ?? null,
      comment: input.comment,
      privateFlag: input.privateFlag ?? true,
      rating: input.rating ?? undefined,
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

/** Generic: reviews received by a user (Market producer or Care caregiver/owner). */
export async function getReviewsForReviewee(
  revieweeId: string,
  opts?: { type?: "MARKET" | "CARE"; resolved?: boolean }
) {
  return prisma.review.findMany({
    where: {
      revieweeId,
      ...(opts?.type != null ? { type: opts.type } : {}),
      ...(opts?.resolved != null ? { resolved: opts.resolved } : {}),
      hiddenByAdmin: false,
    },
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

export async function setProducerResponse(reviewId: string, producerResponse: string) {
  return prisma.review.update({
    where: { id: reviewId },
    data: { producerResponse },
  });
}

/** Admin moderation: hide abusive or off-topic review. */
export async function hideReviewByAdmin(reviewId: string) {
  return prisma.review.update({
    where: { id: reviewId },
    data: { hiddenByAdmin: true },
  });
}

/** Admin: list all reviews with optional filter by hidden. */
export async function getReviewsForAdmin(includeHidden = false) {
  return prisma.review.findMany({
    where: includeHidden ? undefined : { hiddenByAdmin: false },
    include: {
      reviewer: { select: { id: true, name: true, email: true } },
      producer: { select: { id: true, name: true } },
      order: { select: { id: true, productId: true, pickupDate: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
