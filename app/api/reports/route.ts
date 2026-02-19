/**
 * POST /api/reports - Create a report (auth required)
 * GET /api/reports - List reports (admin only, filter by status)
 */

import { NextRequest } from "next/server";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createReport, getReportsForAdminPaginated, getReportsMine, getReportsForProducer } from "@/lib/reports";
import { ok, fail, parseJsonBody, withRequestId, failStructured } from "@/lib/api";
import { logError } from "@/lib/logger";
import { checkRateLimit, RATE_LIMIT_PRESETS } from "@/lib/rate-limit";
import { ReportsQuerySchema } from "@/lib/validators";
import { z } from "zod";

const CreateReportSchema = z.object({
  reason: z.enum(["SPAM", "INAPPROPRIATE_CONTENT", "SCAM", "HARASSMENT", "OTHER"]),
  description: z.string().optional(),
  entityType: z.enum(["caregiver", "help_exchange_posting", "order"]),
  entityId: z.string().min(1),
  problemType: z.enum(["LATE", "DAMAGED", "MISSING", "NOT_AS_DESCRIBED", "WRONG_ITEM", "OTHER"]).optional(),
  proposedOutcome: z.enum(["REFUND", "PARTIAL_REFUND", "REPLACEMENT", "STORE_CREDIT", "OTHER"]).optional(),
  attachments: z.array(z.object({ url: z.string().url(), mimeType: z.string().min(1), sizeBytes: z.number().int().min(0) })).max(3).optional(),
}).refine(
  (data) => {
    if (data.entityType !== "order") return true;
    return !!data.problemType && !!data.proposedOutcome;
  },
  { message: "problemType and proposedOutcome are required for order reports", path: ["entityType"] }
);

export async function POST(request: NextRequest) {
  const requestId = withRequestId(request);
  const rateLimitRes = await checkRateLimit(request, RATE_LIMIT_PRESETS.DEFAULT, requestId);
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return fail("Unauthorized", { code: "UNAUTHORIZED", status: 401, requestId });
    }

    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) {
      return fail(parseError, { code: "INVALID_JSON", status: 400, requestId });
    }

    const validation = CreateReportSchema.safeParse(body);
    if (!validation.success) {
      const first = validation.error.issues[0];
      return fail(first?.message ?? "Invalid request", {
        code: "VALIDATION_ERROR",
        status: 400,
        requestId,
      });
    }

    // Verify entity exists
    if (validation.data.entityType === "caregiver") {
      const caregiver = await prisma.user.findFirst({
        where: {
          id: validation.data.entityId,
          isCaregiver: true,
        },
      });
      if (!caregiver) {
        return failStructured(
          { code: "ENTITY_NOT_FOUND", message: "Caregiver not found" },
          404,
          requestId
        );
      }
    } else if (validation.data.entityType === "help_exchange_posting") {
      const posting = await prisma.helpExchangePosting.findUnique({
        where: { id: validation.data.entityId },
      });
      if (!posting) {
        return failStructured(
          { code: "ENTITY_NOT_FOUND", message: "Help exchange posting not found" },
          404,
          requestId
        );
      }
    } else if (validation.data.entityType === "order") {
      const order = await prisma.order.findUnique({
        where: { id: validation.data.entityId },
        select: { buyerId: true, producerId: true },
      });
      if (!order) {
        return failStructured(
          { code: "ENTITY_NOT_FOUND", message: "Order not found" },
          404,
          requestId
        );
      }
      if (order.buyerId !== user.id && order.producerId !== user.id) {
        return fail("You can only report an order you are part of", { code: "FORBIDDEN", status: 403, requestId });
      }
    }

    const report = await createReport({
      reporterId: user.id,
      reason: validation.data.reason,
      description: validation.data.description,
      entityType: validation.data.entityType,
      entityId: validation.data.entityId,
      problemType: validation.data.problemType as any,
      proposedOutcome: validation.data.proposedOutcome as any,
      attachments: validation.data.attachments,
    });

    return ok({ report }, requestId);
  } catch (error) {
    logError("reports/POST", error, {
      requestId,
      path: "/api/reports",
      method: "POST",
    });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}

export async function GET(request: NextRequest) {
  const requestId = withRequestId(request);
  const user = await getCurrentUser();
  const searchParams = request.nextUrl.searchParams;
  const mine = searchParams.get("mine") === "1";
  const forMe = searchParams.get("forMe") === "1";

  if (mine || forMe) {
    if (!user) {
      return fail("Unauthorized", { code: "UNAUTHORIZED", status: 401, requestId });
    }
    try {
      const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
      const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));
      const { reports, total } = mine
        ? await getReportsMine(user.id, page, pageSize)
        : await getReportsForProducer(user.id, page, pageSize);
      return ok({ items: reports, page, pageSize, total, reports }, requestId);
    } catch (error) {
      logError("reports/GET mine|forMe", error, { requestId, path: "/api/reports", method: "GET" });
      return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
    }
  }

  try {
    await requireAdmin();
  } catch {
    return fail("Forbidden", { code: "FORBIDDEN", status: 403, requestId });
  }

  try {
    const queryParams = {
      status: searchParams.get("status") || undefined,
      entityType: searchParams.get("entityType") || undefined,
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
    };

    const validation = ReportsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      const first = validation.error.issues[0];
      return fail(first?.message ?? "Invalid query parameters", {
        code: "VALIDATION_ERROR",
        status: 400,
        requestId,
      });
    }

    const page = validation.data.page ?? 1;
    const pageSize = validation.data.pageSize ?? 50;
    const filters = {
      ...(validation.data.status && { status: validation.data.status as any }),
      ...(validation.data.entityType && { entityType: validation.data.entityType }),
    };

    const { reports, total } = await getReportsForAdminPaginated(filters, page, pageSize);

    return ok({ items: reports, page, pageSize, total, reports }, requestId);
  } catch (error) {
    logError("reports/GET", error, {
      requestId,
      path: "/api/reports",
      method: "GET",
    });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
