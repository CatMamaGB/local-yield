/**
 * GET /api/catalog/categories — categories for current producer: predefined groups + custom (own + approved).
 * Producer only. Used by ProductCatalogForm to build dropdown.
 */

import { NextRequest } from "next/server";
import { requireProducerOrAdmin } from "@/lib/auth";
import { PRODUCT_CATEGORY_GROUPS, getCustomCategoriesForProducer } from "@/lib/catalog-categories";
import { ok, addCorsHeaders, handleCorsPreflight } from "@/lib/api";
import { mapAuthErrorToResponse } from "@/lib/auth/error-handler";
import { logError } from "@/lib/logger";
import { getRequestId } from "@/lib/request-id";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  try {
    const user = await requireProducerOrAdmin();
    const customCategories = await getCustomCategoriesForProducer(user.id);
    const response = ok({ groups: PRODUCT_CATEGORY_GROUPS, customCategories }, requestId);
    return addCorsHeaders(response, request);
  } catch (e) {
    logError("catalog/categories/GET", e, { requestId, path: "/api/catalog/categories", method: "GET" });
    const errorResponse = mapAuthErrorToResponse(e, requestId);
    return addCorsHeaders(errorResponse, request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request) || new Response(null, { status: 403 });
}
