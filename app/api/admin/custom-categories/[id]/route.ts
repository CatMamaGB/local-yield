/**
 * PATCH /api/admin/custom-categories/[id] — approve, reject, or edit a custom category.
 * Body: { status?: "APPROVED" | "REJECTED", correctedName?: string }.
 * - Approve: status "APPROVED", optional correctedName. Sets approvedAt; category becomes public.
 * - Reject: status "REJECTED". Category is hidden from producer and everyone.
 * - Edit only: omit status, set correctedName. Saves spelling fix; stays PENDING. Approve later to publish.
 * All actions are logged for audit.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAdminCustomCategoryAction } from "@/lib/catalog-categories";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;

  try {
    const admin = await requireAdmin();
    const { id } = await params;
    if (!id) return fail("Missing category id", "VALIDATION_ERROR", 400);

    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) return fail(parseError, "INVALID_JSON", 400);

    const status = body?.status === "APPROVED" ? "APPROVED" : body?.status === "REJECTED" ? "REJECTED" : null;
    const correctedName =
      body?.correctedName != null ? String(body.correctedName).trim() || null : undefined;

    const existing = await prisma.customCategory.findUnique({ where: { id } });
    if (!existing) return fail("Custom category not found", "NOT_FOUND", 404);
    if (existing.status === "APPROVED") return fail("Already approved", "VALIDATION_ERROR", 400);
    if (existing.status === "REJECTED") return fail("Already rejected", "VALIDATION_ERROR", 400);

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
      await logAdminCustomCategoryAction(admin.id, "CUSTOM_CATEGORY_APPROVE", id, {
        name: existing.name,
        correctedName: updated.correctedName ?? undefined,
        previousStatus,
      });
    } else if (status === "REJECTED") {
      await logAdminCustomCategoryAction(admin.id, "CUSTOM_CATEGORY_REJECT", id, {
        name: existing.name,
        previousStatus,
      });
    } else if (correctedName !== undefined) {
      await logAdminCustomCategoryAction(admin.id, "CUSTOM_CATEGORY_EDIT", id, {
        name: existing.name,
        correctedName: updated.correctedName ?? undefined,
        previousStatus,
      });
    }

    return ok({
      customCategory: {
        id: updated.id,
        name: updated.name,
        correctedName: updated.correctedName,
        status: updated.status,
        approvedAt: updated.approvedAt?.toISOString() ?? null,
      },
    });
  } catch (e) {
    logError("admin/custom-categories/[id]/PATCH", e, { requestId, path: "/api/admin/custom-categories/[id]", method: "PATCH" });
    const message = e instanceof Error ? e.message : "";
    if (message === "Forbidden") return fail(message, "FORBIDDEN", 403);
    return fail("Something went wrong", "INTERNAL_ERROR", 500, { requestId });
  }
}
