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
  const reviewType = input.type ?? "MARKET";
  
  if (isPublic && isNegative && orderId) {
    const allowed = await canPublishNegativePublicReview(orderId);
    if (!allowed) {
      throw new Error(
        "You can’t publish a negative public review until the resolution window has passed. Try again later or leave a private message to the producer."
      );
    }
  }
  
  // producerId is required in schema; use revieweeId when not provided (CARE: reviewee is caregiver; MARKET: reviewee is producer)
  const producerId = input.producerId ?? input.revieweeId;

  return prisma.review.create({
    data: {
      reviewerId: input.reviewerId,
      revieweeId: input.revieweeId,
      producerId,
      type: reviewType,
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

/** Buyer's review for a specific order (if any). For showing Leave/Update review on order. */
export async function getReviewByOrderForBuyer(buyerId: string, orderId: string) {
  return prisma.review.findFirst({
    where: { orderId, reviewerId: buyerId, type: "MARKET" },
    select: {
      id: true,
      comment: true,
      rating: true,
      privateFlag: true,
      resolved: true,
      createdAt: true,
      adminGuidance: true,
    },
  });
}

/** Buyer updates their own review (comment/rating). Allowed only while review is still private. */
export async function updateReviewByReviewer(
  reviewId: string,
  reviewerId: string,
  data: { comment?: string; rating?: number }
) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { reviewerId: true, privateFlag: true },
  });
  if (!review || review.reviewerId !== reviewerId) {
    throw new Error("Review not found or you are not the reviewer.");
  }
  if (!review.privateFlag) {
    throw new Error("You can only update a review before it is made public.");
  }
  return prisma.review.update({
    where: { id: reviewId },
    data: {
      ...(data.comment !== undefined && { comment: data.comment.trim() }),
      ...(data.rating !== undefined && { rating: data.rating >= 1 && data.rating <= 5 ? data.rating : undefined }),
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

/** Producer: approve review (make it public). */
export async function approveReviewByProducer(reviewId: string, producerId: string) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { revieweeId: true, privateFlag: true },
  });
  if (!review || review.revieweeId !== producerId) {
    throw new Error("Review not found or you are not the producer.");
  }
  return prisma.review.update({
    where: { id: reviewId },
    data: { privateFlag: false },
  });
}

/** Producer: flag review for admin (unfair or unrelated). */
export async function flagReviewByProducer(reviewId: string, producerId: string) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { revieweeId: true },
  });
  if (!review || review.revieweeId !== producerId) {
    throw new Error("Review not found or you are not the producer.");
  }
  return prisma.review.update({
    where: { id: reviewId },
    data: { flaggedForAdmin: true, flaggedAt: new Date() },
  });
}

/** Admin moderation: hide abusive or off-topic review. */
export async function hideReviewByAdmin(reviewId: string) {
  return prisma.review.update({
    where: { id: reviewId },
    data: { hiddenByAdmin: true },
  });
}

/** Producer: list reviews received (pending = privateFlag true, not hidden). */
export async function getPendingReviewsForProducer(producerId: string) {
  return prisma.review.findMany({
    where: {
      revieweeId: producerId,
      type: "MARKET",
      privateFlag: true,
      hiddenByAdmin: false,
    },
    include: {
      reviewer: { select: { id: true, name: true, email: true } },
      order: { select: { id: true, productId: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Admin: list all reviews with optional filter by hidden; include flagged. */
export async function getReviewsForAdmin(includeHidden = false) {
  return prisma.review.findMany({
    where: includeHidden ? undefined : { hiddenByAdmin: false },
    select: {
      id: true,
      comment: true,
      rating: true,
      producerResponse: true,
      resolved: true,
      hiddenByAdmin: true,
      flaggedForAdmin: true,
      flaggedAt: true,
      privateFlag: true,
      adminGuidance: true,
      createdAt: true,
      type: true,
      careBookingId: true,
      reviewer: { select: { id: true, name: true, email: true } },
      producer: { select: { id: true, name: true } },
      order: { select: { id: true, productId: true, pickupDate: true } },
    },
    orderBy: [{ flaggedForAdmin: "desc" }, { createdAt: "desc" }],
  });
}

/** Admin: get only flagged reviews for the flagged dashboard. */
export async function getFlaggedReviewsForAdmin() {
  return prisma.review.findMany({
    where: { flaggedForAdmin: true, type: "MARKET" },
    include: {
      reviewer: { select: { id: true, name: true, email: true } },
      producer: { select: { id: true, name: true, email: true } },
      order: { select: { id: true, productId: true, pickupDate: true } },
    },
    orderBy: { flaggedAt: "desc" },
  });
}

/** Admin: clear flag (dismiss producer's flag). */
export async function dismissFlagByAdmin(reviewId: string) {
  return prisma.review.update({
    where: { id: reviewId },
    data: { flaggedForAdmin: false, flaggedAt: null },
  });
}

/** Admin: approve flagged review (clear flag and make public — review is fair). */
export async function approveFlaggedReviewByAdmin(reviewId: string) {
  return prisma.review.update({
    where: { id: reviewId },
    data: { flaggedForAdmin: false, flaggedAt: null, privateFlag: false },
  });
}

/** Admin: set guidance on a review (for producer/buyer). */
export async function setAdminGuidance(reviewId: string, guidance: string | null) {
  return prisma.review.update({
    where: { id: reviewId },
    data: { adminGuidance: guidance?.trim() || null },
  });
}
