/**
 * Item requests: buyers ask for eggs, honey, etc.; producers see demand in radius.
 */

import { prisma } from "./prisma";
import { getDistanceBetweenZips } from "./geo";

export interface CreateItemRequestInput {
  requesterId: string;
  description: string;
  zipCode: string;
  radiusMiles?: number;
}

export async function createItemRequest(input: CreateItemRequestInput) {
  return prisma.itemRequest.create({
    data: {
      requesterId: input.requesterId,
      description: input.description.trim(),
      zipCode: input.zipCode.trim().slice(0, 5),
      radiusMiles: input.radiusMiles ?? undefined,
    },
  });
}

/** Max item requests to return in list endpoints (avoids unbounded queries). */
const MAX_ITEM_REQUESTS = 100;

/** List open item requests within radius (miles) of producer ZIP. Capped at MAX_ITEM_REQUESTS. */
export async function listItemRequestsByRadius(zipCode: string, radiusMiles: number) {
  const zip = zipCode.trim().slice(0, 5);
  if (!zip) return [];
  const all = await prisma.itemRequest.findMany({
    where: { status: "open" },
    include: { requester: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: MAX_ITEM_REQUESTS,
  });
  const withDistance = all
    .map((r) => {
      const distance = getDistanceBetweenZips(zip, r.zipCode);
      if (distance == null || distance > radiusMiles) return null;
      return { ...r, distance };
    })
    .filter((r): r is NonNullable<typeof r> => r != null);
  return withDistance.sort((a, b) => a.distance - b.distance);
}

/** List item requests created by a user (for "my requests"). Capped at MAX_ITEM_REQUESTS. */
export async function listItemRequestsByRequester(requesterId: string) {
  return prisma.itemRequest.findMany({
    where: { requesterId },
    orderBy: { createdAt: "desc" },
    take: MAX_ITEM_REQUESTS,
  });
}
