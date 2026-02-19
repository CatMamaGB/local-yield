/**
 * Log when producer sees a category suggestion and accepts or overrides it.
 * Used to build a frequency table for better suggestions later. Never auto-changes saved products.
 */

import { prisma } from "@/lib/prisma";
import { normalizeProductName } from "@/lib/catalog-suggestions";

export interface LogProductCategorySuggestionParams {
  normalizedTitle: string;
  suggestedCategoryId: string;
  chosenCategoryId: string;
  accepted: boolean;
}

/**
 * Insert a ProductCategorySuggestionLog row. Fire-and-forget; never throw to caller.
 */
export async function logProductCategorySuggestion(
  params: LogProductCategorySuggestionParams
): Promise<void> {
  const normalized = normalizeProductName(params.normalizedTitle);
  if (!normalized.trim()) return;

  try {
    await prisma.productCategorySuggestionLog.create({
      data: {
        normalizedTitle: normalized.slice(0, 500),
        suggestedCategoryId: params.suggestedCategoryId.slice(0, 100),
        chosenCategoryId: params.chosenCategoryId.slice(0, 100),
        accepted: params.accepted,
      },
    });
  } catch {
    // Dev-safe: ignore DB errors (e.g. table not yet migrated)
  }
}
