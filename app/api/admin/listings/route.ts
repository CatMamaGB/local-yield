/**
 * GET /api/admin/listings - List all listings (market + care) (admin only)
 * Query params: type (market|care), active, q (search title), limit
 */

import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, withRequestId } from "@/lib/api";
import { logError } from "@/lib/logger";
import { AdminListingsQuerySchema } from "@/lib/validators";

type AdminListingItem =
  | { id: string; type: "market"; title: string; active: boolean; creator: { id: string; name: string | null; email: string }; createdAt: Date }
  | { id: string; type: "care"; title: string; active: boolean; creator: { id: string; name: string | null; email: string }; createdAt: Date };

export async function GET(request: NextRequest) {
  const requestId = withRequestId(request);
  try {
    await requireAdmin();
  } catch {
    return fail("Forbidden", { code: "FORBIDDEN", status: 403, requestId });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      type: searchParams.get("type") || undefined,
      active: searchParams.get("active") || undefined,
      q: searchParams.get("q") || undefined,
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
    };

    const validation = AdminListingsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      const first = validation.error.issues[0];
      return fail(first?.message ?? "Invalid query parameters", {
        code: "VALIDATION_ERROR",
        status: 400,
        requestId,
      });
    }

    const type = validation.data.type;
    const active = validation.data.active;
    const q = validation.data.q?.toLowerCase();
    const page = validation.data.page ?? 1;
    const pageSize = validation.data.pageSize ?? 50;
    const cap = 500;

    const results: AdminListingItem[] = [];

    if (!type || type === "market") {
      const where: Prisma.ProductWhereInput = {};
      if (q) where.title = { contains: q, mode: "insensitive" };
      const products = await prisma.product.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: cap,
      });
      results.push(
        ...products.map((p) => ({
          id: p.id,
          type: "market" as const,
          title: p.title,
          active: true,
          creator: p.user,
          createdAt: p.createdAt,
        }))
      );
    }

    if (!type || type === "care") {
      const where: Prisma.CareServiceListingWhereInput = {};
      if (active !== null && active !== undefined) where.active = active;
      if (q) where.title = { contains: q, mode: "insensitive" };
      const careListings = await prisma.careServiceListing.findMany({
        where,
        include: {
          caregiver: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: cap,
      });
      results.push(
        ...careListings.map((l) => ({
          id: l.id,
          type: "care" as const,
          title: l.title,
          active: l.active,
          creator: l.caregiver,
          createdAt: l.createdAt,
        }))
      );
    }

    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = results.length;
    const skip = (page - 1) * pageSize;
    const items = results.slice(skip, skip + pageSize);

    return ok({ items, page, pageSize, total, listings: items }, requestId);
  } catch (error) {
    logError("admin/listings/GET", error, {
      requestId,
      path: "/api/admin/listings",
      method: "GET",
    });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
