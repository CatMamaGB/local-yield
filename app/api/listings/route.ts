/**
 * GET /api/listings?zip=90210&radius=25&q=eggs&group=produce&category=fruits&sort=newest&page=1&pageSize=50
 * Returns listings with distance and label (nearby / fartherOut).
 * Supports group/category filter, q search, sort (distance|newest|price_asc|rating), pagination + hard cap.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDistanceBetweenZips } from "@/lib/geo";
import { getCategoryIdsForGroup } from "@/lib/catalog-categories";
import { getAggregateRatingsForReviewees } from "@/lib/reviews";
import type { BrowseListing, ListingLabel } from "@local-yield/shared/types/listings";
import { ok, fail, addCorsHeaders, handleCorsPreflight } from "@/lib/api";
import { logError } from "@/lib/logger";
import { getRequestId } from "@/lib/request-id";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { ListingsQuerySchema } from "@/lib/validators";

const DEFAULT_RADIUS = 25;
const PAGE_SIZE_MAX = 50;
const TOTAL_CAP = 500;

/** Mock listings when DB is empty (for demo). */
const MOCK_LISTINGS = [
  { title: "Farm Fresh Eggs", zip: "90210", price: 6.5, category: "Produce", description: "Pasture-raised.", delivery: false, pickup: true },
  { title: "Weekly Veggie Box", zip: "90211", price: 28, category: "Produce", description: "Seasonal vegetables.", delivery: true, pickup: true },
  { title: "Goat Cheese", zip: "91325", price: 12, category: "Dairy", description: "Local goat cheese.", delivery: false, pickup: true },
  { title: "Raw Honey", zip: "91401", price: 15, category: "Pantry", description: "Unfiltered honey.", delivery: true, pickup: true },
];

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request, RATE_LIMIT_PRESETS.DEFAULT, requestId);
  if (rateLimitRes) {
    // rateLimitRes is a Response, convert to NextResponse for CORS
    const nextRes = NextResponse.json(
      await rateLimitRes.json(),
      { status: rateLimitRes.status }
    );
    return addCorsHeaders(nextRes, request);
  }
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      zip: searchParams.get("zip") || undefined,
      radius: searchParams.get("radius") || undefined,
      q: searchParams.get("q") || undefined,
      group: searchParams.get("group") || undefined,
      category: searchParams.get("category") || undefined,
      sort: searchParams.get("sort") || undefined,
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
    };
    
    const validation = ListingsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      const first = validation.error.issues[0];
      return fail(first?.message ?? "Invalid query parameters", {
        code: "VALIDATION_ERROR",
        status: 400,
        requestId,
      });
    }
    
    const zip = validation.data.zip && validation.data.zip !== "" ? validation.data.zip : null;
    const radiusMiles = validation.data.radius ?? DEFAULT_RADIUS;
    const q = validation.data.q?.toLowerCase().trim() || "";
    const group = validation.data.group?.trim();
    const category = validation.data.category?.trim();
    const sortBy = validation.data.sort ?? "distance";
    const page = validation.data.page ?? 1;
    const pageSize = Math.min(PAGE_SIZE_MAX, validation.data.pageSize ?? PAGE_SIZE_MAX);

    type Row = { id: string; title: string; description: string; price: number; imageUrl: string | null; stockImage: string | null; category: string; delivery: boolean; pickup: boolean; userId: string; unit: string | null; isOrganic: boolean | null; createdAt: Date; user: { name: string | null; zipCode: string | null }; featuredUntil: Date | null };
    let rows: Row[];

    try {
      const products = await prisma.product.findMany({
        include: {
          user: {
            select: {
              name: true,
              zipCode: true,
              producerProfile: { select: { featuredUntil: true } },
            },
          },
        },
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
        unit: p.unit ?? null,
        isOrganic: p.isOrganic ?? null,
        createdAt: p.createdAt,
        user: { name: p.user.name, zipCode: p.user.zipCode },
        featuredUntil: p.user.producerProfile?.featuredUntil ?? null,
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
        unit: null,
        isOrganic: null,
        createdAt: new Date(),
        user: { name: "Demo Producer", zipCode: item.zip },
        featuredUntil: null,
      }));
    }

    // Category filter: exact category, or group (subcategories in group)
    let categoryFiltered = rows;
    if (category) {
      categoryFiltered = rows.filter((r) => r.category.toLowerCase() === category.toLowerCase());
    } else if (group) {
      const categoryIds = getCategoryIdsForGroup(group);
      if (categoryIds.length > 0) {
        const set = new Set(categoryIds.map((c) => c.toLowerCase()));
        categoryFiltered = rows.filter((r) => set.has(r.category.toLowerCase()));
      }
    }

    // Optional keyword search
    const filtered = q
      ? categoryFiltered.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q) ||
            r.category.toLowerCase().includes(q)
        )
      : categoryFiltered;

    const now = new Date();
    const withDistance: (BrowseListing & { createdAt: Date })[] = filtered.map((r) => {
      const listingZip = r.user.zipCode;
      const distance =
        zip && listingZip ? getDistanceBetweenZips(zip, listingZip) : null;
      const label: ListingLabel =
        distance == null ? "nearby" : distance <= radiusMiles ? "nearby" : "fartherOut";
      const featured = !!(r.featuredUntil && r.featuredUntil >= now);
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
        zip: listingZip ?? "",
        distance,
        label,
        featured,
        isOrganic: r.isOrganic ?? null,
        unit: r.unit ?? null,
        createdAt: r.createdAt,
      };
    });

    const producerIds = [...new Set(withDistance.map((r) => r.producerId))];
    const ratingsMap = await getAggregateRatingsForReviewees(producerIds, { type: "MARKET" });
    const withRating: BrowseListing[] = withDistance.map((r) => ({
      ...r,
      averageRating: ratingsMap.get(r.producerId)?.averageRating ?? null,
    }));

    const sorted = [...withRating].sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      if (sortBy === "rating") {
        const ra = a.averageRating ?? 0;
        const rb = b.averageRating ?? 0;
        if (ra !== rb) return rb - ra;
      }
      if (sortBy === "price_asc") {
        if (a.price !== b.price) return a.price - b.price;
      }
      if (sortBy === "newest") {
        const ta = a.createdAt?.getTime() ?? 0;
        const tb = b.createdAt?.getTime() ?? 0;
        if (ta !== tb) return tb - ta;
      }
      if (sortBy === "distance" || !sortBy) {
        if (a.label !== b.label) return a.label === "nearby" ? -1 : 1;
        const da = a.distance ?? 9999;
        const db = b.distance ?? 9999;
        return da - db;
      }
      if (a.label !== b.label) return a.label === "nearby" ? -1 : 1;
      const da = a.distance ?? 9999;
      const db = b.distance ?? 9999;
      return da - db;
    });

    const totalRaw = sorted.length;
    const total = Math.min(totalRaw, TOTAL_CAP);
    const skip = (page - 1) * pageSize;
    const capped = sorted.slice(0, TOTAL_CAP);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const items = capped.slice(skip, skip + pageSize).map(({ createdAt: _c, ...listing }) => listing);

    const response = ok({
      items,
      page,
      pageSize,
      total,
      listings: items,
      userZip: zip,
      radiusMiles,
    }, requestId);
    return addCorsHeaders(response, request);
  } catch (e) {
    logError("listings/GET", e, { requestId, path: "/api/listings", method: "GET" });
    const errorResponse = fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
    return addCorsHeaders(errorResponse, request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request) || new Response(null, { status: 403 });
}
