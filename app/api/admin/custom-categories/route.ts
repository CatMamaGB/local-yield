/**
 * GET /api/admin/custom-categories — list custom categories for admin review.
 * Query: status=PENDING (default) | APPROVED, page=1, limit=15, search= (optional, by name or creator email).
 * Returns paginated pending list with total and totalPages when status=PENDING.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getPendingCustomCategoriesForAdmin } from "@/lib/catalog-categories";
import { ok, fail, withRequestId } from "@/lib/api";
import { mapAuthErrorToResponse } from "@/lib/auth/error-handler";
import { logError } from "@/lib/logger";
import { AdminCustomCategoriesQuerySchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const requestId = withRequestId(request);
  try {
    await requireAdmin();
  } catch (e) {
    return mapAuthErrorToResponse(e, requestId);
  }
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      status: searchParams.get("status") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const validation = AdminCustomCategoriesQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      const first = validation.error.issues[0];
      return fail(first?.message ?? "Invalid query parameters", {
        code: "VALIDATION_ERROR",
        status: 400,
        requestId,
      });
    }

    const status = validation.data.status === "APPROVED" ? "APPROVED" : "PENDING";
    const page = validation.data.page ?? 1;
    const limit = validation.data.limit ?? 15;
    const search = validation.data.search;

    if (status === "PENDING") {
      const result = await getPendingCustomCategoriesForAdmin({ page, limit, search });
      return ok({
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

    return ok({
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
  } catch (e) {
    logError("admin/custom-categories/GET", e, { requestId, path: "/api/admin/custom-categories", method: "GET" });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
