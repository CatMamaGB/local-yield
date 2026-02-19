/**
 * Log product name → category for telemetry (improve suggestions later).
 * No PII beyond product name. Safe for dev and production.
 */

import { prisma } from "@/lib/prisma";
import { normalizeProductName } from "@/lib/catalog-suggestions";

export interface LogProductNameEventParams {
  rawName: string;
  groupId: string;
  categoryId: string;
}

/**
 * Insert a ProductNameEvent row. Fire-and-forget; never throw to caller.
 */
export async function logProductNameEvent(params: LogProductNameEventParams): Promise<void> {
  const normalized = normalizeProductName(params.rawName);
  if (!params.rawName.trim()) return;

  try {
    await prisma.productNameEvent.create({
      data: {
        rawName: params.rawName.trim().slice(0, 500),
        normalizedName: normalized.slice(0, 500),
        groupId: params.groupId,
        categoryId: params.categoryId,
      },
    });
  } catch {
    // Dev-safe: ignore DB errors (e.g. table not yet migrated)
  }
}
