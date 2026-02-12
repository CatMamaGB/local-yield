/**
 * PATCH /api/admin/custom-categories/[id] — approve, reject, or edit a custom category.
 * Body: { status?: "APPROVED" | "REJECTED", correctedName?: string }.
 * - Approve: status "APPROVED", optional correctedName. Sets approvedAt; category becomes public.
 * - Reject: status "REJECTED". Category is hidden from producer and everyone.
 * - Edit only: omit status, set correctedName. Saves spelling fix; stays PENDING. Approve later to publish.
 * All actions are logged for audit.
 */

import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAdminCustomCategoryAction } from "@/lib/catalog-categories";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let adminId: string;
  try {
    const admin = await requireAdmin();
    adminId = admin.id;
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing category id" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const status = body.status === "APPROVED" ? "APPROVED" : body.status === "REJECTED" ? "REJECTED" : null;
  const correctedName =
    body.correctedName != null ? String(body.correctedName).trim() || null : undefined;

  const existing = await prisma.customCategory.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Custom category not found" }, { status: 404 });
  if (existing.status === "APPROVED") {
    return NextResponse.json({ error: "Already approved" }, { status: 400 });
  }
  if (existing.status === "REJECTED") {
    return NextResponse.json({ error: "Already rejected" }, { status: 400 });
  }

  const previousStatus = existing.status;
  const updateData: {
    status?: "APPROVED" | "REJECTED";
    correctedName?: string | null;
    approvedAt?: Date | null;
  } = {};
  if (status === "APPROVED") {
    updateData.status = "APPROVED";
    updateData.approvedAt = new Date();
  } else if (status === "REJECTED") {
    updateData.status = "REJECTED";
  }
  if (correctedName !== undefined) updateData.correctedName = correctedName;

  const updated = await prisma.customCategory.update({
    where: { id },
    data: updateData,
  });

  if (status === "APPROVED") {
    await logAdminCustomCategoryAction(adminId, "CUSTOM_CATEGORY_APPROVE", id, {
      name: existing.name,
      correctedName: updated.correctedName ?? undefined,
      previousStatus,
    });
  } else if (status === "REJECTED") {
    await logAdminCustomCategoryAction(adminId, "CUSTOM_CATEGORY_REJECT", id, {
      name: existing.name,
      previousStatus,
    });
  } else if (correctedName !== undefined) {
    await logAdminCustomCategoryAction(adminId, "CUSTOM_CATEGORY_EDIT", id, {
      name: existing.name,
      correctedName: updated.correctedName ?? undefined,
      previousStatus,
    });
  }

  return NextResponse.json({
    customCategory: {
      id: updated.id,
      name: updated.name,
      correctedName: updated.correctedName,
      status: updated.status,
      approvedAt: updated.approvedAt?.toISOString() ?? null,
    },
  });
}
