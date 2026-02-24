/**
 * Care business logic: caregiver discovery, bookings, profiles.
 * Uses lib/geo for radius filtering and lib/messaging for conversations.
 */

import { prisma } from "./prisma";
import { getDistanceBetweenZips } from "./geo";
import { getOrCreateConversation } from "./messaging";
import type { AnimalSpecies, CareServiceType, CareBookingStatus, CareTaskType, ExperienceBackground } from "@prisma/client";

export interface ListCaregiversInput {
  zip: string;
  radius: number;
  species?: AnimalSpecies;
  serviceType?: CareServiceType;
}

export interface CaregiverSummary {
  id: string;
  name: string | null;
  zipCode: string | null;
  distance: number | null;
  featured?: boolean;
  caregiverProfile: {
    bio: string | null;
    yearsExperience: number | null;
    experienceBackground: ExperienceBackground[];
    speciesComfort: AnimalSpecies[];
    tasksComfort: CareTaskType[];
    introVideoUrl: string | null;
    introAudioUrl: string | null;
  } | null;
  listings: Array<{
    id: string;
    title: string;
    serviceType: CareServiceType;
    speciesSupported: AnimalSpecies[];
    rateCents: number;
    rateUnit: string;
  }>;
}

/**
 * List caregivers within radius, filtered by species and service type.
 * Returns lightweight summaries with first 1-2 listings for preview.
 */
export async function listCaregiversByRadius(input: ListCaregiversInput): Promise<CaregiverSummary[]> {
  // Get all caregivers with active listings
  const caregivers = await prisma.user.findMany({
    where: {
      isCaregiver: true,
      caregiverListings: {
        some: {
          active: true,
          ...(input.species && {
            speciesSupported: { has: input.species },
          }),
          ...(input.serviceType && {
            serviceType: input.serviceType,
          }),
        },
      },
    },
    include: {
      caregiverProfile: {
        select: {
          bio: true,
          yearsExperience: true,
          experienceBackground: true,
          speciesComfort: true,
          tasksComfort: true,
          introVideoUrl: true,
          introAudioUrl: true,
          featuredUntil: true,
        },
      },
      caregiverListings: {
        where: {
          active: true,
          ...(input.species && {
            speciesSupported: { has: input.species },
          }),
          ...(input.serviceType && {
            serviceType: input.serviceType,
          }),
        },
        select: {
          id: true,
          title: true,
          serviceType: true,
          speciesSupported: true,
          rateCents: true,
          rateUnit: true,
          serviceRadiusMiles: true,
        },
        take: 2, // Preview: first 1-2 listings
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // Filter by radius and distance
  const withDistance = caregivers
    .map((caregiver) => {
      const distance = caregiver.zipCode
        ? getDistanceBetweenZips(input.zip, caregiver.zipCode)
        : null;
      const nearby = distance !== null && distance <= input.radius;
      
      // Check if any listing is within radius
      const hasNearbyListing = caregiver.caregiverListings.some(
        (listing) => distance !== null && distance <= listing.serviceRadiusMiles
      );

      return {
        ...caregiver,
        distance,
        nearby: nearby && hasNearbyListing,
      };
    })
    .filter((c) => c.nearby && c.caregiverListings.length > 0)
    .map((c) => ({
      ...c,
      featured: !!(c.caregiverProfile?.featuredUntil && new Date() <= c.caregiverProfile.featuredUntil),
    }))
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      const da = a.distance ?? 9999;
      const db = b.distance ?? 9999;
      return da - db;
    });

  return withDistance.map((c) => ({
    id: c.id,
    name: c.name,
    zipCode: c.zipCode,
    distance: c.distance ?? null,
    featured: c.featured,
    caregiverProfile: c.caregiverProfile,
    listings: c.caregiverListings.map((l) => ({
      id: l.id,
      title: l.title,
      serviceType: l.serviceType,
      speciesSupported: l.speciesSupported,
      rateCents: l.rateCents,
      rateUnit: l.rateUnit,
    })),
  }));
}

/**
 * Get full caregiver profile with all listings and public reviews.
 */
export async function getCaregiverProfile(caregiverId: string) {
  const caregiver = await prisma.user.findUnique({
    where: { id: caregiverId, isCaregiver: true },
    include: {
      caregiverProfile: true,
      caregiverListings: {
        where: { active: true },
        orderBy: { createdAt: "desc" },
      },
      reviewsAsReviewee: {
        where: {
          type: "CARE",
          privateFlag: false,
          hiddenByAdmin: false,
        },
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20, // Limit reviews for performance
      },
    },
  });

  if (!caregiver) return null;

  return {
    id: caregiver.id,
    name: caregiver.name,
    zipCode: caregiver.zipCode,
    caregiverProfile: caregiver.caregiverProfile,
    listings: caregiver.caregiverListings,
    reviews: caregiver.reviewsAsReviewee,
  };
}

export interface CreateCareBookingInput {
  seekerId: string;
  caregiverId: string;
  startAt: Date;
  endAt: Date;
  locationZip: string;
  notes?: string;
  species?: AnimalSpecies;
  serviceType?: CareServiceType;
  idempotencyKey?: string;
}

/**
 * Create a care booking request and get/create conversation.
 * Returns bookingId and conversationId.
 * 
 * Overlap rules (normalized):
 * - Start date is inclusive (startAt <= existing.endAt)
 * - End date is inclusive (endAt >= existing.startAt)
 * - All dates stored and compared in UTC
 * - Overlap check: startAt <= existing.endAt && endAt >= existing.startAt
 */
export async function createCareBooking(input: CreateCareBookingInput) {
  // Normalize dates to UTC for consistent comparison
  const startAtUtc = new Date(input.startAt.toISOString());
  const endAtUtc = new Date(input.endAt.toISOString());

  // Idempotency check: if idempotencyKey provided and booking exists, return existing
  if (input.idempotencyKey) {
    const existing = await prisma.careBooking.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) {
      const conversation = await prisma.conversation.findFirst({
        where: { careBookingId: existing.id },
      });
      return {
        bookingId: existing.id,
        conversationId: conversation?.id ?? "",
      };
    }
  }

  // Verify caregiver exists
  const caregiver = await prisma.user.findUnique({
    where: { id: input.caregiverId, isCaregiver: true },
  });
  if (!caregiver) {
    throw new Error("Caregiver not found");
  }

  // Availability check: look for overlapping REQUESTED or ACCEPTED bookings
  // Overlap: startAt <= existing.endAt && endAt >= existing.startAt (inclusive boundaries)
  const overlapping = await prisma.careBooking.findFirst({
    where: {
      caregiverId: input.caregiverId,
      status: { in: ["REQUESTED", "ACCEPTED"] },
      AND: [
        { startAt: { lte: endAtUtc } },
        { endAt: { gte: startAtUtc } },
      ],
    },
  });

  if (overlapping) {
    throw new Error("CAREGIVER_UNAVAILABLE");
  }

  // Create booking
  const booking = await prisma.careBooking.create({
    data: {
      careSeekerId: input.seekerId,
      caregiverId: input.caregiverId,
      startAt: startAtUtc,
      endAt: endAtUtc,
      locationZip: input.locationZip,
      notes: input.notes,
      species: input.species,
      serviceType: input.serviceType,
      idempotencyKey: input.idempotencyKey ?? null,
      status: "REQUESTED",
    },
  });

  // Get or create conversation linked to booking
  const conversation = await getOrCreateConversation({
    userAId: input.seekerId,
    userBId: input.caregiverId,
    careBookingId: booking.id,
  });

  // Notify caregiver
  const { createNotification } = await import("@/lib/notify/notify");
  await createNotification({
    userId: input.caregiverId,
    type: "BOOKING_REQUESTED",
    title: "New booking request",
    body: `You have a new booking request.`,
    link: `/dashboard/care-bookings`,
  });

  return {
    bookingId: booking.id,
    conversationId: conversation.id,
  };
}

export interface UpdateCareBookingStatusInput {
  actorId: string;
  bookingId: string;
  newStatus: CareBookingStatus;
}

/**
 * Update booking status with permission checks:
 * - Caregiver can ACCEPT/DECLINE
 * - Seeker can CANCEL
 * - Valid transitions only
 */
export async function updateCareBookingStatus(input: UpdateCareBookingStatusInput) {
  const booking = await prisma.careBooking.findUnique({
    where: { id: input.bookingId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  // Permission checks
  const isCaregiver = booking.caregiverId === input.actorId;
  const isSeeker = booking.careSeekerId === input.actorId;

  if (!isCaregiver && !isSeeker) {
    throw new Error("Unauthorized");
  }

  // Validate transitions
  if (input.newStatus === "ACCEPTED" || input.newStatus === "DECLINED") {
    if (!isCaregiver) {
      throw new Error("Only caregiver can accept or decline");
    }
    if (booking.status !== "REQUESTED") {
      throw new Error("Can only accept/decline requested bookings");
    }
  }

  // Cancellation rules: either party can cancel REQUESTED or ACCEPTED before start date
  if (input.newStatus === "CANCELED") {
    if (!isSeeker && !isCaregiver) {
      throw new Error("Only seeker or caregiver can cancel");
    }
    if (booking.status === "COMPLETED" || booking.status === "DECLINED") {
      throw new Error("Cannot cancel completed or declined bookings");
    }
    const now = new Date();
    if (now >= booking.startAt) {
      throw new Error("Cannot cancel bookings after start date");
    }
  }

  const updated = await prisma.careBooking.update({
    where: { id: input.bookingId },
    data: { status: input.newStatus },
    include: {
      careSeeker: { select: { id: true, name: true } },
      caregiver: { select: { id: true, name: true } },
    },
  });

  // Notify seeker when caregiver accepts or declines
  if ((input.newStatus === "ACCEPTED" || input.newStatus === "DECLINED") && updated.careSeekerId) {
    const { createNotification } = await import("@/lib/notify/notify");
    await createNotification({
      userId: updated.careSeekerId,
      type: input.newStatus === "ACCEPTED" ? "BOOKING_ACCEPTED" : "BOOKING_DECLINED",
      title: input.newStatus === "ACCEPTED" ? "Booking accepted" : "Booking declined",
      body:
        input.newStatus === "ACCEPTED"
          ? `${updated.caregiver.name || "The helper"} accepted your booking request.`
          : `${updated.caregiver.name || "The helper"} declined your booking request.`,
      link: `/dashboard/care-bookings`,
    });
  }

  return updated;
}

/**
 * Get or create conversation for a booking (used when redirecting to messages).
 */
export async function getOrCreateBookingConversation(input: {
  seekerId: string;
  caregiverId: string;
  bookingId: string;
}) {
  return getOrCreateConversation({
    userAId: input.seekerId,
    userBId: input.caregiverId,
    careBookingId: input.bookingId,
  });
}

/**
 * Get single booking by id; returns null if not found or user is not participant/admin.
 */
export async function getBookingByIdForUser(
  bookingId: string,
  userId: string,
  isAdmin: boolean
) {
  const booking = await prisma.careBooking.findUnique({
    where: { id: bookingId },
    include: {
      careSeeker: { select: { id: true, name: true, zipCode: true } },
      caregiver: { select: { id: true, name: true, zipCode: true } },
    },
  });
  if (!booking) return null;
  if (isAdmin || booking.careSeekerId === userId || booking.caregiverId === userId) return booking;
  return null;
}

/**
 * Get bookings relevant to a user (as seeker or caregiver).
 */
export async function getBookingsForUser(userId: string) {
  return prisma.careBooking.findMany({
    where: {
      OR: [
        { careSeekerId: userId },
        { caregiverId: userId },
      ],
    },
    include: {
      careSeeker: {
        select: {
          id: true,
          name: true,
          zipCode: true,
        },
      },
      caregiver: {
        select: {
          id: true,
          name: true,
          zipCode: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
