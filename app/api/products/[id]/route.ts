/**
 * GET /api/products/[id] — get one product (public for shop; ownership for edit).
 * PATCH /api/products/[id] — update (producer owner or admin).
 * DELETE /api/products/[id] — delete (producer owner or admin).
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProducerOrAdmin } from "@/lib/auth";
import { ok, fail, parseJsonBody, addCorsHeaders, handleCorsPreflight, withCorsOnRateLimit } from "@/lib/api";
import { mapAuthErrorToResponse } from "@/lib/auth/error-handler";
import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";
import { ProductCategorySchema, ProductUnitSchema } from "@/lib/validators";

type ProductPatchBody = {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  imageUrl?: string | null;
  delivery?: boolean;
  pickup?: boolean;
  quantityAvailable?: number | null;
  unit?: string | null;
  isOrganic?: boolean | null;
  groupId?: string | null;
  suggestedCategoryId?: string | null;
  suggestionAccepted?: boolean | null;
};

async function getProductAndCheckOwnership(id: string, requireAuth = true) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return { product: null, error: "Not found" as const };
  if (!requireAuth) return { product, error: null };
  const user = await requireProducerOrAdmin().catch(() => null);
  if (!user) return { product: null, error: "Unauthorized" as const };
  if (product.userId !== user.id && user.role !== "ADMIN") {
    return { product: null, error: "Forbidden" as const };
  }
  return { product, error: null };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, zipCode: true } } },
    });
    if (!product) return addCorsHeaders(fail("Not found", { code: "NOT_FOUND", status: 404, requestId }), request);
    return addCorsHeaders(ok({ product }, requestId), request);
  } catch (error) {
    logError("products/[id]/GET", error, { requestId, path: "/api/products/[id]", method: "GET" });
    return addCorsHeaders(fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId }), request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request) || new Response(null, { status: 403 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request, undefined, requestId);
  if (rateLimitRes) return withCorsOnRateLimit(rateLimitRes, request) ?? rateLimitRes;

  try {
    const { id } = await params;
    const { error } = await getProductAndCheckOwnership(id);
    if (error) {
      const status = error === "Not found" ? 404 : error === "Unauthorized" ? 401 : 403;
      const code = error === "Not found" ? "NOT_FOUND" : error === "Unauthorized" ? "UNAUTHORIZED" : "FORBIDDEN";
      return addCorsHeaders(fail(error, { code, status, requestId }), request);
    }

    const { data: body, error: parseError } = await parseJsonBody<ProductPatchBody>(request);
    if (parseError) return addCorsHeaders(fail(parseError, { code: "INVALID_JSON", status: 400, requestId }), request);
    if (!body) return addCorsHeaders(fail("Request body is required", { code: "VALIDATION_ERROR", status: 400, requestId }), request);

    const updates: Record<string, unknown> = {};
    if (body?.title !== undefined) updates.title = String(body.title).trim();
    if (body?.description !== undefined) updates.description = String(body.description).trim();
    if (body?.price !== undefined) {
      const p = Number(body.price);
      const PRICE_MAX = 999_999.99;
      if (!Number.isNaN(p) && p > 0 && p <= PRICE_MAX) updates.price = p;
    }
    if (body?.category !== undefined) {
      const categoryRaw = String(body.category).trim();
      const categoryResult = ProductCategorySchema.safeParse(categoryRaw);
      if (!categoryResult.success) {
        return addCorsHeaders(fail("Category must be one of the allowed category IDs", { code: "VALIDATION_ERROR", status: 400, requestId }), request);
      }
      updates.category = categoryResult.data;
    }
    if (body?.imageUrl !== undefined) updates.imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;
    if (body?.delivery !== undefined) updates.delivery = Boolean(body.delivery);
    if (body?.pickup !== undefined) updates.pickup = Boolean(body.pickup);
    if (body?.quantityAvailable !== undefined) {
      const q = body.quantityAvailable === null ? null : Number(body.quantityAvailable);
      if (q !== null && (!Number.isInteger(q) || q < 0)) {
        return addCorsHeaders(fail("Quantity available must be a non-negative integer", { code: "VALIDATION_ERROR", status: 400, requestId }), request);
      }
      updates.quantityAvailable = q !== null ? q : null;
    }
    if (body?.unit !== undefined) {
      const unitRaw = body.unit === null ? "" : String(body.unit).trim();
      const unitResult = ProductUnitSchema.safeParse(unitRaw);
      if (!unitResult.success) {
        return addCorsHeaders(fail("Unit must be one of: each, lb, bunch, dozen, jar, box", { code: "VALIDATION_ERROR", status: 400, requestId }), request);
      }
      updates.unit = unitResult.data;
    }
    if (body?.isOrganic !== undefined) {
      updates.isOrganic = body.isOrganic === true ? true : body.isOrganic === false ? false : null;
    }
    const updated = await prisma.product.update({
      where: { id },
      data: updates as Parameters<typeof prisma.product.update>[0]["data"],
    });

    if (updated.title && (updates.title !== undefined || updates.category !== undefined)) {
      const { logProductNameEvent } = await import("@/lib/product-name-event");
      const { getGroupIdForCategoryId } = await import("@/lib/catalog-categories");
      await logProductNameEvent({
        rawName: updated.title,
        groupId: (body?.groupId != null ? String(body.groupId).trim() : null) || getGroupIdForCategoryId(updated.category),
        categoryId: updated.category,
      });
    }

    const suggestedCategoryId = body?.suggestedCategoryId != null ? String(body.suggestedCategoryId).trim() : null;
    const suggestionAccepted = body?.suggestionAccepted === true || body?.suggestionAccepted === false ? body.suggestionAccepted : null;
    if (suggestedCategoryId && suggestionAccepted !== null) {
      const { logProductCategorySuggestion } = await import("@/lib/product-category-suggestion-log");
      await logProductCategorySuggestion({
        normalizedTitle: updated.title,
        suggestedCategoryId,
        chosenCategoryId: updated.category,
        accepted: suggestionAccepted,
      });
    }

    return addCorsHeaders(ok({ product: updated }, requestId), request);
  } catch (error) {
    logError("products/[id]/PATCH", error, { requestId, path: "/api/products/[id]", method: "PATCH" });
    const errorResponse = mapAuthErrorToResponse(error, requestId);
    return addCorsHeaders(errorResponse, request);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request, undefined, requestId);
  if (rateLimitRes) return withCorsOnRateLimit(rateLimitRes, request) ?? rateLimitRes;

  try {
    const { id } = await params;
    const { error } = await getProductAndCheckOwnership(id);
    if (error) {
      const status = error === "Not found" ? 404 : error === "Unauthorized" ? 401 : 403;
      const code = error === "Not found" ? "NOT_FOUND" : error === "Unauthorized" ? "UNAUTHORIZED" : "FORBIDDEN";
      return addCorsHeaders(fail(error, { code, status, requestId }), request);
    }
    await prisma.product.delete({ where: { id } });
    return addCorsHeaders(ok(undefined, requestId), request);
  } catch (error) {
    logError("products/[id]/DELETE", error, { requestId, path: "/api/products/[id]", method: "DELETE" });
    const errorResponse = mapAuthErrorToResponse(error, requestId);
    return addCorsHeaders(errorResponse, request);
  }
}
