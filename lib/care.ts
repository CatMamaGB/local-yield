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
  zipCode: string;
  distance: number | null;
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
      const distance = getDistanceBetweenZips(input.zip, caregiver.zipCode);
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
    .sort((a, b) => {
      const da = a.distance ?? 9999;
      const db = b.distance ?? 9999;
      return da - db;
    });

  return withDistance.map((c) => ({
    id: c.id,
    name: c.name,
    zipCode: c.zipCode,
    distance: c.distance ?? null,
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
}

/**
 * Create a care booking request and get/create conversation.
 * Returns bookingId and conversationId.
 */
export async function createCareBooking(input: CreateCareBookingInput) {
  // Verify caregiver exists
  const caregiver = await prisma.user.findUnique({
    where: { id: input.caregiverId, isCaregiver: true },
  });
  if (!caregiver) {
    throw new Error("Caregiver not found");
  }

  // Create booking
  const booking = await prisma.careBooking.create({
    data: {
      careSeekerId: input.seekerId,
      caregiverId: input.caregiverId,
      startAt: input.startAt,
      endAt: input.endAt,
      locationZip: input.locationZip,
      notes: input.notes,
      species: input.species,
      serviceType: input.serviceType,
      status: "REQUESTED",
    },
  });

  // Get or create conversation linked to booking
  const conversation = await getOrCreateConversation({
    userAId: input.seekerId,
    userBId: input.caregiverId,
    careBookingId: booking.id,
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

  if (input.newStatus === "CANCELED") {
    if (!isSeeker) {
      throw new Error("Only seeker can cancel");
    }
    if (booking.status === "COMPLETED" || booking.status === "DECLINED") {
      throw new Error("Cannot cancel completed or declined bookings");
    }
  }

  // Update status
  return prisma.careBooking.update({
    where: { id: input.bookingId },
    data: { status: input.newStatus },
  });
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
