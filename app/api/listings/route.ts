/**
 * GET /api/listings?zip=90210&radius=25&q=eggs
 * Returns listings with distance and label (nearby / fartherOut).
 * Sorted: nearby first, then fartherOut; each group by distance.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDistanceBetweenZips } from "@/lib/geo";
import type { BrowseListing, ListingLabel } from "@/types/listings";

const DEFAULT_RADIUS = 25;

/** Mock listings when DB is empty (for demo). */
const MOCK_LISTINGS = [
  { title: "Farm Fresh Eggs", zip: "90210", price: 6.5, category: "Produce", description: "Pasture-raised.", delivery: false, pickup: true },
  { title: "Weekly Veggie Box", zip: "90211", price: 28, category: "Produce", description: "Seasonal vegetables.", delivery: true, pickup: true },
  { title: "Goat Cheese", zip: "91325", price: 12, category: "Dairy", description: "Local goat cheese.", delivery: false, pickup: true },
  { title: "Raw Honey", zip: "91401", price: 15, category: "Pantry", description: "Unfiltered honey.", delivery: true, pickup: true },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zip = searchParams.get("zip")?.trim().slice(0, 5) || null;
  const radiusMiles = Math.min(100, Math.max(1, Number(searchParams.get("radius")) || DEFAULT_RADIUS));
  const q = searchParams.get("q")?.trim().toLowerCase() || "";

  let rows: { id: string; title: string; description: string; price: number; imageUrl: string | null; stockImage: string | null; category: string; delivery: boolean; pickup: boolean; userId: string; user: { name: string | null; zipCode: string } }[];

  try {
    const products = await prisma.product.findMany({
      include: { user: { select: { name: true, zipCode: true } } },
    });
    rows = products.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price,
      imageUrl: p.imageUrl,
      stockImage: p.stockImage,
      category: p.category,
      delivery: p.delivery,
      pickup: p.pickup,
      userId: p.userId,
      user: { name: p.user.name, zipCode: p.user.zipCode },
    }));
  } catch {
    // DB not ready or empty: use mock data
    rows = MOCK_LISTINGS.map((item, i) => ({
      id: `mock-${i}`,
      title: item.title,
      description: item.description,
      price: item.price,
      imageUrl: null,
      stockImage: null,
      category: item.category,
      delivery: item.delivery,
      pickup: item.pickup,
      userId: `mock-user-${i}`,
      user: { name: "Demo Producer", zipCode: item.zip },
    }));
  }

  // Optional search filter
  const filtered = q
    ? rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      )
    : rows;

  // Add distance and label; sort nearby first, then fartherOut
  const withDistance: BrowseListing[] = filtered.map((r) => {
    const listingZip = r.user.zipCode;
    const distance =
      zip && listingZip ? getDistanceBetweenZips(zip, listingZip) : null;
    const withinRadius =
      distance != null && distance <= radiusMiles;
    const label: ListingLabel = withinRadius ? "nearby" : "fartherOut";
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      price: r.price,
      imageUrl: r.imageUrl,
      stockImage: r.stockImage,
      category: r.category,
      delivery: r.delivery,
      pickup: r.pickup,
      producerId: r.userId,
      producerName: r.user.name,
      zip: listingZip,
      distance,
      label,
    };
  });

  const sorted = [...withDistance].sort((a, b) => {
    // Nearby first
    if (a.label !== b.label) return a.label === "nearby" ? -1 : 1;
    // Then by distance (null last)
    const da = a.distance ?? 9999;
    const db = b.distance ?? 9999;
    return da - db;
  });

  return Response.json({
    listings: sorted,
    userZip: zip,
    radiusMiles,
  });
}
