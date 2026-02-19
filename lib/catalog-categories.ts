/**
 * Catalog categories: custom categories (prisma) and re-exports from product-categories.
 * Use lib/product-categories from client components; use this file from server/API only.
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export {
  PRODUCT_CATEGORY_GROUPS,
  PREDEFINED_GROUP_IDS,
  ALLOWED_CATEGORY_IDS,
  getCategoryIdsForGroup,
  getGroupIdForCategoryId,
  type ProductSubcategory,
  type ProductCategoryGroup,
  type AllowedCategoryId,
} from "./product-categories";

export interface CustomCategoryForProducer {
  id: string;
  name: string;
  correctedName: string | null;
  status: "PENDING" | "APPROVED";
  groupId: string | null;
  defaultImageUrl: string | null;
  isMine: boolean;
}

/** Custom categories visible to this producer: their own (PENDING or APPROVED only) + approved from others. Rejected are hidden. */
export async function getCustomCategoriesForProducer(producerId: string): Promise<CustomCategoryForProducer[]> {
  const rows = await prisma.customCategory.findMany({
    where: {
      OR: [
        { createdById: producerId, status: { in: ["PENDING", "APPROVED"] } },
        { status: "APPROVED" },
      ],
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    correctedName: r.correctedName,
    status: r.status as "PENDING" | "APPROVED",
    groupId: r.groupId,
    defaultImageUrl: r.defaultImageUrl,
    isMine: r.createdById === producerId,
  }));
}

export interface PendingCustomCategoryForAdmin {
  id: string;
  name: string;
  correctedName: string | null;
  status: string;
  groupId: string | null;
  defaultImageUrl: string | null;
  createdAt: string;
  createdBy: { id: string; name: string | null; email: string } | null;
}

export interface PendingCustomCategoriesResult {
  list: PendingCustomCategoryForAdmin[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Pending custom categories for admin review with pagination and optional search. */
export async function getPendingCustomCategoriesForAdmin(options: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PendingCustomCategoriesResult> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(50, Math.max(5, options.limit ?? 15));
  const search = options.search?.trim().toLowerCase();
  const skip = (page - 1) * limit;

  const where: Prisma.CustomCategoryWhereInput = { status: "PENDING" };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { createdBy: { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] } },
    ];
  }


  const [list, total] = await Promise.all([
    prisma.customCategory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.customCategory.count({ where }),
  ]);

  return {
    list: list.map((c) => ({
      id: c.id,
      name: c.name,
      correctedName: c.correctedName,
      status: c.status,
      groupId: c.groupId,
      defaultImageUrl: c.defaultImageUrl,
      createdAt: c.createdAt.toISOString(),
      createdBy: c.createdBy
        ? { id: c.createdBy.id, name: c.createdBy.name, email: c.createdBy.email }
        : null,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/** Log an admin action on a custom category for audit. */
export async function logAdminCustomCategoryAction(
  adminId: string,
  action: "CUSTOM_CATEGORY_APPROVE" | "CUSTOM_CATEGORY_REJECT" | "CUSTOM_CATEGORY_EDIT",
  entityId: string,
  details: { name?: string; correctedName?: string | null; previousStatus?: string }
): Promise<void> {
  await prisma.adminActionLog.create({
    data: {
      performedById: adminId,
      action,
      entityType: "CustomCategory",
      entityId,
      details: details as object,
    },
  });
}

export interface AdminActionLogEntry {
  id: string;
  action: string;
  entityId: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  performedBy: { id: string; name: string | null; email: string };
}

/** Recent admin action logs for custom categories (for audit display). */
export async function getCustomCategoryActionLogs(limit = 50): Promise<AdminActionLogEntry[]> {
  const rows = await prisma.adminActionLog.findMany({
    where: { entityType: "CustomCategory" },
    orderBy: { createdAt: "desc" },
    take: Math.min(100, limit),
    include: {
      performedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    entityId: r.entityId,
    details: r.details as Record<string, unknown> | null,
    createdAt: r.createdAt.toISOString(),
    performedBy: r.performedBy,
  }));
}