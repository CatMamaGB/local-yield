/**
 * Community feed: events, help exchange postings, products (by zip/radius).
 * Used by GET /api/feed and server components.
 */

import { prisma } from "./prisma";
import { getDistanceBetweenZips } from "./geo";

const DEFAULT_RADIUS = 25;
const MAX_EVENTS = 10;
const MAX_POSTINGS = 10;
const MAX_PRODUCTS = 10;

export interface FeedResult {
  events: Array<{
    id: string;
    type: "event";
    name: string;
    location: string;
    eventDate: string;
    eventHours: string | null;
    producerId: string;
    producerName: string | null;
    distance: number | null;
  }>;
  postings: Array<{
    id: string;
    type: "posting";
    title: string;
    category: string;
    zipCode: string;
    createdAt: string;
    createdByName: string | null;
    distance: number | null;
  }>;
  products: Array<{
    id: string;
    type: "product";
    title: string;
    price: number;
    producerId: string;
    producerName: string | null;
    createdAt: string;
    distance: number | null;
  }>;
}

export async function getFeed(zip: string | null, radius: number = DEFAULT_RADIUS): Promise<FeedResult> {
  const [events, postings, products] = await Promise.all([
    prisma.event.findMany({
      where: { eventDate: { gte: new Date() } },
      include: { user: { select: { id: true, name: true, zipCode: true } } },
      orderBy: { eventDate: "asc" },
      take: MAX_EVENTS * 2,
    }),
    prisma.helpExchangePosting.findMany({
      where: { status: "OPEN" },
      include: { createdBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: MAX_POSTINGS * 2,
    }),
    prisma.product.findMany({
      include: { user: { select: { id: true, name: true, zipCode: true } } },
      orderBy: { createdAt: "desc" },
      take: MAX_PRODUCTS * 2,
    }),
  ]);

  const withDistance = (item: { user?: { zipCode: string } }) =>
    zip && item.user?.zipCode ? getDistanceBetweenZips(zip, item.user.zipCode) : null;

  const eventsFiltered = zip
    ? events.filter((e) => (withDistance(e) ?? 999) <= radius).slice(0, MAX_EVENTS)
    : events.slice(0, MAX_EVENTS);
  const postingsFiltered = zip
    ? postings.filter((p) => (getDistanceBetweenZips(zip, p.zipCode) ?? 999) <= radius).slice(0, MAX_POSTINGS)
    : postings.slice(0, MAX_POSTINGS);
  const productsFiltered = zip
    ? products.filter((p) => (withDistance(p) ?? 999) <= radius).slice(0, MAX_PRODUCTS)
    : products.slice(0, MAX_PRODUCTS);

  return {
    events: eventsFiltered.map((e) => ({
      id: e.id,
      type: "event" as const,
      name: e.name,
      location: e.location,
      eventDate: e.eventDate.toISOString(),
      eventHours: e.eventHours,
      producerId: e.userId,
      producerName: e.user.name,
      distance: withDistance(e),
    })),
    postings: postingsFiltered.map((p) => ({
      id: p.id,
      type: "posting" as const,
      title: p.title,
      category: p.category,
      zipCode: p.zipCode,
      createdAt: p.createdAt.toISOString(),
      createdByName: p.createdBy.name,
      distance: zip ? getDistanceBetweenZips(zip, p.zipCode) : null,
    })),
    products: productsFiltered.map((p) => ({
      id: p.id,
      type: "product" as const,
      title: p.title,
      price: p.price,
      producerId: p.userId,
      producerName: p.user.name,
      createdAt: p.createdAt.toISOString(),
      distance: withDistance(p),
    })),
  };
}
