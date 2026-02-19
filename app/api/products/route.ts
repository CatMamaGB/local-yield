/**
 * GET /api/products — list products for current producer.
 * POST /api/products — create product (producer only). Body: title, price, description?, category?, imageUrl?, delivery, pickup, quantityAvailable?
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProducerOrAdmin } from "@/lib/auth";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";
import { ProductCategorySchema, ProductUnitSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  try {
    const user = await requireProducerOrAdmin();
    const products = await prisma.product.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return ok({ products });
  } catch (e) {
    logError("products/GET", e, { requestId, path: "/api/products", method: "GET" });
    const message = e instanceof Error ? e.message : "Forbidden";
    return fail(message, { code: "FORBIDDEN", status: 403 });
  }
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request, undefined, requestId);
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await requireProducerOrAdmin();
    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) return fail(parseError, { code: "INVALID_JSON", status: 400, requestId });

    const title = String(body?.title ?? "").trim();
    const price = Number(body?.price);
    const PRICE_MAX = 999_999.99;
    if (!title || Number.isNaN(price) || price <= 0 || price > PRICE_MAX) {
      return fail("Title and a valid price (greater than 0, max 999,999.99) are required", { code: "VALIDATION_ERROR", status: 400, requestId });
    }
    const description = String(body?.description ?? "").trim() || "No description.";
    const categoryRaw = body?.category != null ? String(body.category).trim() : "other";
    const categoryResult = ProductCategorySchema.safeParse(categoryRaw);
    if (!categoryResult.success) {
      return fail("Category must be one of the allowed category IDs", { code: "VALIDATION_ERROR", status: 400, requestId });
    }
    const quantityAvailable = body?.quantityAvailable != null ? Number(body.quantityAvailable) : null;
    if (quantityAvailable != null && (! Number.isInteger(quantityAvailable) || quantityAvailable < 0)) {
      return fail("Quantity available must be a non-negative integer", { code: "VALIDATION_ERROR", status: 400, requestId });
    }
    const category = categoryResult.data;
    const unitRaw = body?.unit != null ? String(body.unit).trim() : "";
    const unitResult = ProductUnitSchema.safeParse(unitRaw);
    if (unitRaw !== "" && !unitResult.success) {
      return fail("Unit must be one of: each, lb, bunch, dozen, jar, box", { code: "VALIDATION_ERROR", status: 400, requestId });
    }
    const unit = unitResult.success ? unitResult.data : null;
    const imageUrl = body?.imageUrl ? String(body.imageUrl).trim() : null;
    const delivery = Boolean(body?.delivery);
    const pickup = Boolean(body?.pickup);
    const isOrganic = body?.isOrganic === true ? true : body?.isOrganic === false ? false : null;

    const product = await prisma.product.create({
      data: {
        userId: user.id,
        title,
        description,
        price,
        imageUrl: imageUrl || null,
        category,
        delivery,
        pickup,
        quantityAvailable: quantityAvailable != null && Number.isInteger(quantityAvailable) && quantityAvailable >= 0 ? quantityAvailable : null,
        ...(unit != null ? { unit } : {}),
        ...(typeof isOrganic === "boolean" ? { isOrganic } : {}),
      },
    });

    const { logProductNameEvent } = await import("@/lib/product-name-event");
    const { getGroupIdForCategoryId } = await import("@/lib/catalog-categories");
    await logProductNameEvent({
      rawName: title,
      groupId: (body?.groupId != null ? String(body.groupId).trim() : null) || getGroupIdForCategoryId(category),
      categoryId: category,
    });

    const suggestedCategoryId = body?.suggestedCategoryId != null ? String(body.suggestedCategoryId).trim() : null;
    const suggestionAccepted = body?.suggestionAccepted === true || body?.suggestionAccepted === false ? body.suggestionAccepted : null;
    if (suggestedCategoryId && suggestionAccepted !== null) {
      const { logProductCategorySuggestion } = await import("@/lib/product-category-suggestion-log");
      await logProductCategorySuggestion({
        normalizedTitle: title,
        suggestedCategoryId,
        chosenCategoryId: category,
        accepted: suggestionAccepted,
      });
    }

    return ok({ product });
  } catch (e) {
    logError("products/POST", e, { requestId, path: "/api/products", method: "POST" });
    const message = e instanceof Error ? e.message : "";
    if (message === "Forbidden") return fail(message, { code: "FORBIDDEN", status: 403 });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
