/**
 * GET /api/catalog/categories — categories for current producer: predefined groups + custom (own + approved).
 * Producer only. Used by ProductCatalogForm to build dropdown.
 */

import { NextResponse } from "next/server";
import { requireProducerOrAdmin } from "@/lib/auth";
import { PRODUCT_CATEGORY_GROUPS, getCustomCategoriesForProducer } from "@/lib/catalog-categories";

export async function GET() {
  try {
    const user = await requireProducerOrAdmin();
    const customCategories = await getCustomCategoriesForProducer(user.id);
    return NextResponse.json({
      groups: PRODUCT_CATEGORY_GROUPS,
      customCategories,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Forbidden";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
