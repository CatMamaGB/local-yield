/**
 * PATCH /api/admin/reports/[id] - Assign, resolve (outcome + note + amount). Admin only.
 * When status=RESOLVED and resolutionOutcome=STORE_CREDIT, creates CreditLedger entry.
 */

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateReportAdmin, getReportById } from "@/lib/reports";
import { ok, fail, parseJsonBody, withRequestId } from "@/lib/api";
import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const UpdateReportAdminSchema = z.object({
  assignedToId: z.union([z.string(), z.literal("me")]).nullable().optional(),
  status: z.enum(["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"]).optional(),
  resolutionOutcome: z.enum(["REFUND", "PARTIAL_REFUND", "STORE_CREDIT", "RESOLVED_NO_REFUND", "DISMISSED"]).nullable().optional(),
  resolutionNote: z.string().nullable().optional(),
  resolutionAmountCents: z.number().int().min(0).nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = withRequestId(request);
  const rateLimitRes = await checkRateLimit(request, undefined, requestId);
  if (rateLimitRes) return rateLimitRes;

  let admin: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    admin = await requireAdmin();
  } catch {
    return fail("Forbidden", { code: "FORBIDDEN", status: 403, requestId });
  }

  const { id } = await params;
  const existing = await getReportById(id);
  if (!existing) {
    return fail("Report not found", { code: "NOT_FOUND", status: 404, requestId });
  }

  const { data: body, error: parseError } = await parseJsonBody(request);
  if (parseError) {
    return fail(parseError, { code: "INVALID_JSON", status: 400, requestId });
  }

  const validation = UpdateReportAdminSchema.safeParse(body);
  if (!validation.success) {
    const first = validation.error.issues[0];
    return fail(first?.message ?? "Invalid request", {
      code: "VALIDATION_ERROR",
      status: 400,
      requestId,
    });
  }

  const data = validation.data;
  if (data.status === "RESOLVED" && data.resolutionOutcome === "STORE_CREDIT" && (data.resolutionAmountCents == null || data.resolutionAmountCents <= 0)) {
    return fail("resolutionAmountCents required when resolving with STORE_CREDIT", {
      code: "VALIDATION_ERROR",
      status: 400,
      requestId,
    });
  }

  try {
    const assignedToId = data.assignedToId === "me" ? admin.id : data.assignedToId ?? undefined;
    const report = await updateReportAdmin(id, {
      assignedToId: assignedToId !== undefined ? assignedToId : undefined,
      status: data.status,
      resolutionOutcome: data.resolutionOutcome,
      resolutionNote: data.resolutionNote,
      resolutionAmountCents: data.resolutionAmountCents,
      reviewedById: admin.id,
    });

    if (data.status === "RESOLVED" && data.resolutionOutcome === "STORE_CREDIT" && existing.entityType === "order" && data.resolutionAmountCents != null && data.resolutionAmountCents > 0) {
      const order = await prisma.order.findUnique({
        where: { id: existing.entityId },
        select: { buyerId: true, producerId: true },
      });
      if (order) {
        await prisma.creditLedger.create({
          data: {
            userId: order.buyerId,
            producerId: order.producerId,
            amountCents: data.resolutionAmountCents,
            reason: "DISPUTE_RESOLUTION",
            orderId: existing.entityId,
            reportId: id,
            createdById: admin.id,
          },
        });
        const { createNotification } = await import("@/lib/notify/notify");
        const amount = (data.resolutionAmountCents ?? 0) / 100;
        await createNotification({
          userId: order.buyerId,
          type: "STORE_CREDIT_ISSUED",
          title: "Store credit issued",
          body: `You received $${amount.toFixed(2)} in store credit from a resolved dispute. It can only be used at that producer's shop.`,
          link: "/dashboard/orders",
        });
      }
    }

    await prisma.adminActionLog.create({
      data: {
        performedById: admin.id,
        action: "REPORT_UPDATE",
        entityType: "Report",
        entityId: id,
        details: {
          previousStatus: existing.status,
          newStatus: data.status ?? existing.status,
          resolutionOutcome: data.resolutionOutcome,
          resolutionAmountCents: data.resolutionAmountCents,
        },
      },
    });

    return ok({ report }, requestId);
  } catch (error) {
    logError("admin/reports/[id]/PATCH", error, {
      requestId,
      path: "/api/admin/reports/[id]",
      method: "PATCH",
    });
    const message = error instanceof Error ? error.message : "";
    if (message === "Forbidden") return fail(message, { code: "FORBIDDEN", status: 403, requestId });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
