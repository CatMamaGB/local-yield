/**
 * Help Exchange: job postings for farm help (fence repairs, garden help, equipment).
 */

import { prisma } from "@/lib/prisma";
import { filterByZipAndRadius } from "@/lib/geo";
import type { HelpExchangeCategory, HelpExchangeStatus } from "@prisma/client";

export interface CreateHelpExchangePostingInput {
  createdById: string;
  title: string;
  description: string;
  category: HelpExchangeCategory;
  zipCode: string;
  radiusMiles?: number;
}

export interface HelpExchangePostingWithDistance {
  id: string;
  createdById: string;
  title: string;
  description: string;
  category: HelpExchangeCategory;
  zipCode: string;
  radiusMiles: number | null;
  status: HelpExchangeStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name: string | null;
  };
  distance: number | null;
  nearby: boolean;
}

/**
 * Create a help exchange posting.
 */
export async function createHelpExchangePosting(
  input: CreateHelpExchangePostingInput
) {
  const posting = await prisma.helpExchangePosting.create({
    data: {
      createdById: input.createdById,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      zipCode: input.zipCode.trim(),
      radiusMiles: input.radiusMiles ?? null,
      status: "OPEN",
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Optional: notify admin (can be disabled if too noisy)
  // const { createNotification } = await import("./notify/notify");
  // const { requireAdmin } = await import("./auth");
  // try {
  //   const admin = await requireAdmin();
  //   await createNotification({
  //     userId: admin.id,
  //     type: "POSTING_CREATED",
  //     title: "New help exchange posting",
  //     body: `A new help exchange posting has been created.`,
  //     link: `/admin/help-exchange`,
  //   });
  // } catch {
  //   // No admin found, skip notification
  // }

  return posting;
}

/**
 * List help exchange postings by ZIP and radius.
 * Returns postings with distance and nearby flag, sorted: nearby first, then by distance.
 */
export async function listHelpExchangePostingsByRadius(
  zip: string,
  radius: number
): Promise<HelpExchangePostingWithDistance[]> {
  const allPostings = await prisma.helpExchangePosting.findMany({
    where: {
      status: "OPEN",
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Filter by ZIP/radius and add distance
  const withDistance = filterByZipAndRadius(
    zip,
    radius,
    allPostings
  );

  return withDistance.map((item) => ({
    id: item.id,
    createdById: item.createdById,
    title: item.title,
    description: item.description,
    category: item.category,
    zipCode: item.zipCode,
    radiusMiles: item.radiusMiles,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    createdBy: item.createdBy,
    distance: item.distance,
    nearby: item.nearby,
  }));
}

/**
 * List help exchange postings created by a user (for "My job postings").
 */
export async function listHelpExchangePostingsByCreator(createdById: string) {
  return prisma.helpExchangePosting.findMany({
    where: { createdById },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
