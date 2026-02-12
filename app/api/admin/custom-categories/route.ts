/**
 * GET /api/admin/custom-categories — list custom categories for admin review.
 * Query: status=PENDING (default) | APPROVED, page=1, limit=15, search= (optional, by name or creator email).
 * Returns paginated pending list with total and totalPages when status=PENDING.
 */

import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getPendingCustomCategoriesForAdmin } from "@/lib/catalog-categories";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") === "APPROVED" ? "APPROVED" : "PENDING";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(50, Math.max(5, parseInt(searchParams.get("limit") ?? "15", 10) || 15));
  const search = searchParams.get("search")?.trim() || undefined;

  if (status === "PENDING") {
    const result = await getPendingCustomCategoriesForAdmin({ page, limit, search });
    return NextResponse.json({
      customCategories: result.list,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  }

  const list = await prisma.customCategory.findMany({
    where: { status: "APPROVED" },
    orderBy: { approvedAt: "desc" },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return NextResponse.json({
    customCategories: list.map((c) => ({
      id: c.id,
      name: c.name,
      correctedName: c.correctedName,
      status: c.status,
      groupId: c.groupId,
      defaultImageUrl: c.defaultImageUrl,
      createdAt: c.createdAt.toISOString(),
      approvedAt: c.approvedAt?.toISOString() ?? null,
      createdBy: c.createdBy
        ? { id: c.createdBy.id, name: c.createdBy.name, email: c.createdBy.email }
        : null,
    })),
    total: list.length,
    page: 1,
    limit: list.length,
    totalPages: 1,
  });
}
