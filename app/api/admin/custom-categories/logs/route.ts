/**
 * GET /api/admin/custom-categories/logs — recent admin actions on custom categories (audit).
 * Query: limit=50 (default).
 */

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getCustomCategoryActionLogs } from "@/lib/catalog-categories";
import { ok, fail } from "@/lib/api";
import { logError } from "@/lib/logger";
import { getRequestId } from "@/lib/request-id";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  try {
    await requireAdmin();
  } catch {
    return fail("Forbidden", { code: "FORBIDDEN", status: 403 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") ?? "50", 10) || 50));
    const logs = await getCustomCategoryActionLogs(limit);
    return ok({ logs });
  } catch (e) {
    logError("admin/custom-categories/logs/GET", e, { requestId, path: "/api/admin/custom-categories/logs", method: "GET" });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
