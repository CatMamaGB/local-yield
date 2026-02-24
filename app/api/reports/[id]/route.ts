/**
 * GET /api/reports/[id] - Get report detail (admin, or reporter, or producer when order)
 */

import { NextRequest } from "next/server";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { getReportById } from "@/lib/reports";
import { prisma } from "@/lib/prisma";
import { ok, fail, withRequestId } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = withRequestId(request);
  const user = await getCurrentUser();
  if (!user) {
    return fail("Unauthorized", { code: "UNAUTHORIZED", status: 401, requestId });
  }

  const { id } = await params;
  const report = await getReportById(id);
  if (!report) {
    return fail("Report not found", { code: "NOT_FOUND", status: 404, requestId });
  }

  const isAdmin = await requireAdmin().then(() => true).catch(() => false);
  const isReporter = report.reporterId === user.id;
  const isProducerForOrder =
    report.entityType === "order" &&
    (await prisma.order.findUnique({ where: { id: report.entityId }, select: { producerId: true } }))?.producerId === user.id;

  if (!isAdmin && !isReporter && !isProducerForOrder) {
    return fail("Forbidden", { code: "FORBIDDEN", status: 403, requestId });
  }

  return ok({ report }, requestId);
}
