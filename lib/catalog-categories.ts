/**
 * Catalog categories: predefined groups (shared with ProductCatalogForm) and helpers
 * for custom categories. Used by API routes and form.
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export interface ProductSubcategory {
  id: string;
  label: string;
  defaultImageUrl: string;
}

export interface ProductCategoryGroup {
  id: string;
  label: string;
  subcategories: ProductSubcategory[];
}

/** Predefined groups; must match ProductCatalogForm. */
export const PRODUCT_CATEGORY_GROUPS: ProductCategoryGroup[] = [
  { id: "produce", label: "Produce", subcategories: [{ id: "fruits", label: "Fruits", defaultImageUrl: "https://placehold.co/200x200?text=Fruits" }, { id: "vegetables", label: "Vegetables", defaultImageUrl: "https://placehold.co/200x200?text=Vegetables" }, { id: "herbs", label: "Herbs", defaultImageUrl: "https://placehold.co/200x200?text=Herbs" }] },
  { id: "dairy", label: "Dairy", subcategories: [{ id: "milk", label: "Milk", defaultImageUrl: "https://placehold.co/200x200?text=Milk" }, { id: "cheese", label: "Cheese", defaultImageUrl: "https://placehold.co/200x200?text=Cheese" }, { id: "yogurt", label: "Yogurt", defaultImageUrl: "https://placehold.co/200x200?text=Yogurt" }] },
  { id: "meat", label: "Meat", subcategories: [{ id: "poultry", label: "Poultry", defaultImageUrl: "https://placehold.co/200x200?text=Poultry" }, { id: "beef", label: "Beef", defaultImageUrl: "https://placehold.co/200x200?text=Beef" }, { id: "pork", label: "Pork", defaultImageUrl: "https://placehold.co/200x200?text=Pork" }] },
  { id: "baked_goods", label: "Baked Goods", subcategories: [{ id: "bread", label: "Bread", defaultImageUrl: "https://placehold.co/200x200?text=Bread" }, { id: "pastries", label: "Pastries", defaultImageUrl: "https://placehold.co/200x200?text=Pastries" }, { id: "cakes", label: "Cakes", defaultImageUrl: "https://placehold.co/200x200?text=Cakes" }] },
  { id: "beverages", label: "Beverages", subcategories: [{ id: "juices", label: "Juices", defaultImageUrl: "https://placehold.co/200x200?text=Juices" }, { id: "coffee", label: "Coffee", defaultImageUrl: "https://placehold.co/200x200?text=Coffee" }, { id: "tea", label: "Tea", defaultImageUrl: "https://placehold.co/200x200?text=Tea" }] },
  { id: "preserves", label: "Preserves", subcategories: [{ id: "jams", label: "Jams", defaultImageUrl: "https://placehold.co/200x200?text=Jams" }, { id: "pickles", label: "Pickles", defaultImageUrl: "https://placehold.co/200x200?text=Pickles" }, { id: "honey", label: "Honey", defaultImageUrl: "https://placehold.co/200x200?text=Honey" }] },
  { id: "handcrafted", label: "Handcrafted", subcategories: [{ id: "jewelry", label: "Jewelry", defaultImageUrl: "https://placehold.co/200x200?text=Jewelry" }, { id: "pottery", label: "Pottery", defaultImageUrl: "https://placehold.co/200x200?text=Pottery" }, { id: "candles", label: "Candles", defaultImageUrl: "https://placehold.co/200x200?text=Candles" }] },
  { id: "prepared_foods", label: "Prepared Foods", subcategories: [{ id: "sauces", label: "Sauces", defaultImageUrl: "https://placehold.co/200x200?text=Sauces" }, { id: "meals", label: "Meals", defaultImageUrl: "https://placehold.co/200x200?text=Meals" }, { id: "snacks", label: "Snacks", defaultImageUrl: "https://placehold.co/200x200?text=Snacks" }] },
];

export const PREDEFINED_GROUP_IDS = PRODUCT_CATEGORY_GROUPS.map((g) => g.id);

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