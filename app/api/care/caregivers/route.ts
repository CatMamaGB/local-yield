/**
 * GET /api/care/caregivers?zip&radius&species&serviceType&category
 * Returns caregivers within radius with active listings matching filters.
 * Precedence: if both category and serviceType are sent, prefer category and ignore serviceType.
 * Invalid category returns 400 with error { code: "INVALID_CATEGORY", message: "..." }.
 */

import { NextRequest } from "next/server";
import { listCaregiversByRadius } from "@/lib/care";
import { type CareCategory, categoryToServiceType, categoryToCapabilities, VALID_CARE_CATEGORIES } from "@/lib/care/categories";
import type { CaregiverBrowseItem } from "@/lib/care/types";
import { CaregiversQuerySchema } from "@/lib/validators";
import { ok, fail, failStructured, withRequestId } from "@/lib/api";
import { logError } from "@/lib/logger";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { logRequest } from "@/lib/request-log";
import { getIdentifier } from "@/lib/rate-limit-redis";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = withRequestId(request);
  const route = request.nextUrl.pathname;
  const method = request.method;
  const ip = getIdentifier(request);
  
  const rateLimitRes = await checkRateLimit(request, RATE_LIMIT_PRESETS.DEFAULT, requestId);
  if (rateLimitRes) {
    await logRequest({
      requestId,
      route,
      method,
      statusCode: 429,
      durationMs: Date.now() - startTime,
      ip,
      createdAt: new Date(),
    }).catch(() => {});
    return rateLimitRes;
  }
  
  let statusCode = 500;
  let userId: string | undefined;
  
  try {
    // Try to get user ID if available (non-blocking)
    try {
      const { getCurrentUser } = await import("@/lib/auth");
      const user = await getCurrentUser();
      userId = user?.id;
    } catch {
      // User not available - that's fine
    }
    
    try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      zip: searchParams.get("zip") || undefined,
      radius: searchParams.get("radius") || undefined,
      species: searchParams.get("species") || undefined,
      serviceType: searchParams.get("serviceType") || undefined,
      category: searchParams.get("category") || undefined,
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
    };

    const validation = CaregiversQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      const first = validation.error.issues[0];
      return fail(first?.message ?? "Invalid query parameters", {
        code: "VALIDATION_ERROR",
        status: 400,
        requestId,
      });
    }

    const categoryRaw = validation.data.category?.trim();
    if (categoryRaw && !VALID_CARE_CATEGORIES.has(categoryRaw)) {
      return failStructured(
        { code: "INVALID_CATEGORY", message: "Invalid or unknown care category" },
        400,
        requestId
      );
    }

    const zip = validation.data.zip;
    const radius = validation.data.radius ?? 25;
    const species = validation.data.species;
    const page = validation.data.page ?? 1;
    const pageSize = validation.data.pageSize ?? 50;
    const serviceTypeRaw = validation.data.serviceType;

    // If both category and serviceType are sent: prefer category, ignore serviceType.
    const serviceType =
      categoryRaw != null && categoryRaw !== ""
        ? categoryToServiceType(categoryRaw as CareCategory)
        : serviceTypeRaw
          ? (serviceTypeRaw as import("@prisma/client").CareServiceType)
          : undefined;

    if (process.env.NODE_ENV !== "production" && categoryRaw && serviceTypeRaw) {
      console.warn("[care/caregivers] category preferred over serviceType; serviceType ignored");
    }

    const caregivers = await listCaregiversByRadius({
      zip,
      radius,
      ...(species && { species: species as import("@prisma/client").AnimalSpecies }),
      ...(serviceType && { serviceType }),
    });

    const allItems: CaregiverBrowseItem[] = caregivers.map((c) => ({
      id: c.id,
      name: c.name,
      zipCode: c.zipCode,
      distance: c.distance,
      ...(c.featured !== undefined && { featured: c.featured }),
      caregiverProfile: c.caregiverProfile,
      listings: c.listings.map((l) => ({
        id: l.id,
        title: l.title,
        serviceType: l.serviceType,
        speciesSupported: l.speciesSupported,
        rateCents: l.rateCents,
        rateUnit: l.rateUnit,
      })),
      kind: "CARE",
    }));

    const total = allItems.length;
    const skip = (page - 1) * pageSize;
    const items = allItems.slice(skip, skip + pageSize);

    const capabilities =
      categoryRaw && VALID_CARE_CATEGORIES.has(categoryRaw)
        ? categoryToCapabilities(categoryRaw as CareCategory)
        : undefined;

    const search = {
      zip,
      radius,
      ...(categoryRaw && VALID_CARE_CATEGORIES.has(categoryRaw) && { category: categoryRaw }),
    };

      const response = ok(
        { items, page, pageSize, total, caregivers: items, search, ...(capabilities && { capabilities }) },
        requestId
      );
      statusCode = 200;
      
      // Log request (non-blocking)
      await logRequest({
        requestId,
        route,
        method,
        statusCode,
        durationMs: Date.now() - startTime,
        userId,
        ip,
        createdAt: new Date(),
      }).catch(() => {});
      
      return response;
    } catch (error) {
      statusCode = 500;
      logError("care/caregivers/GET", error, { requestId, path: "/api/care/caregivers", method: "GET" });
      const response = fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
      
      // Log error request
      await logRequest({
        requestId,
        route,
        method,
        statusCode,
        durationMs: Date.now() - startTime,
        userId,
        ip,
        createdAt: new Date(),
      }).catch(() => {});
      
      return response;
    }
  } catch (error) {
    statusCode = 500;
    await logRequest({
      requestId,
      route,
      method,
      statusCode,
      durationMs: Date.now() - startTime,
      userId,
      ip,
      createdAt: new Date(),
    }).catch(() => {});
    throw error;
  }
}
