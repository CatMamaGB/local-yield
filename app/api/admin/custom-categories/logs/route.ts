/**
 * GET /api/admin/custom-categories/logs — recent admin actions on custom categories (audit).
 * Query: limit=50 (default).
 */

import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getCustomCategoryActionLogs } from "@/lib/catalog-categories";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") ?? "50", 10) || 50));
  const logs = await getCustomCategoryActionLogs(limit);
  return NextResponse.json({ logs });
}
