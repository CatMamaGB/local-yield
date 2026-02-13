/**
 * GET /api/catalog/categories — categories for current producer: predefined groups + custom (own + approved).
 * Producer only. Used by ProductCatalogForm to build dropdown.
 */

import { NextRequest } from "next/server";
import { requireProducerOrAdmin } from "@/lib/auth";
import { PRODUCT_CATEGORY_GROUPS, getCustomCategoriesForProducer } from "@/lib/catalog-categories";
import { ok, fail } from "@/lib/api";
import { logError } from "@/lib/logger";
import { getRequestId } from "@/lib/request-id";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  try {
    const user = await requireProducerOrAdmin();
    const customCategories = await getCustomCategoriesForProducer(user.id);
    return ok({ groups: PRODUCT_CATEGORY_GROUPS, customCategories });
  } catch (e) {
    logError("catalog/categories/GET", e, { requestId, path: "/api/catalog/categories", method: "GET" });
    const message = e instanceof Error ? e.message : "Forbidden";
    return fail(message, "FORBIDDEN", 403);
  }
}
