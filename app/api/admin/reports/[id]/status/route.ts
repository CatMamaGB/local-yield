/**
 * POST /api/admin/reports/[id]/status - Update report status (admin only)
 * Audit: writes to AdminActionLog for "who changed report status, when".
 */

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateReportStatus } from "@/lib/reports";
import { ok, fail, parseJsonBody, withRequestId } from "@/lib/api";
import { logError } from "@/lib/logger";
import { z } from "zod";

const UpdateReportStatusSchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = withRequestId(request);
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) {
      return fail(parseError, { code: "INVALID_JSON", status: 400, requestId });
    }

    const validation = UpdateReportStatusSchema.safeParse(body);
    if (!validation.success) {
      const first = validation.error.issues[0];
      return fail(first?.message ?? "Invalid request", {
        code: "VALIDATION_ERROR",
        status: 400,
        requestId,
      });
    }

    const existing = await prisma.report.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!existing) {
      return fail("Report not found", { code: "NOT_FOUND", status: 404, requestId });
    }

    const report = await updateReportStatus(id, validation.data.status, admin.id);

    await prisma.adminActionLog.create({
      data: {
        performedById: admin.id,
        action: "REPORT_STATUS_UPDATE",
        entityType: "Report",
        entityId: id,
        details: {
          previousStatus: existing.status,
          newStatus: validation.data.status,
        },
      },
    });

    return ok({ report }, requestId);
  } catch (error) {
    logError("admin/reports/[id]/status/POST", error, {
      requestId,
      path: "/api/admin/reports/[id]/status",
      method: "POST",
    });
    const message = error instanceof Error ? error.message : "";
    if (message === "Forbidden") return fail(message, { code: "FORBIDDEN", status: 403, requestId });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
