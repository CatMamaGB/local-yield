/**
 * GET /api/admin/request-logs — admin-only view of RequestLog entries.
 * Query: page, pageSize, route, method, statusMin, statusMax, userId, since, includeIp
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ok, fail, withRequestId } from "@/lib/api";
import { mapAuthErrorToResponse } from "@/lib/auth/error-handler";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  route: z.string().min(1).optional(),
  method: z.enum(["GET", "POST", "PATCH", "DELETE", "OPTIONS"]).optional(),
  statusMin: z.coerce.number().int().min(100).max(599).optional(),
  statusMax: z.coerce.number().int().min(100).max(599).optional(),
  userId: z.string().min(1).optional(),
  since: z.string().datetime().optional(),
  includeIp: z.coerce.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const requestId = withRequestId(request);
  const rateLimitRes = await checkRateLimit(request, undefined, requestId);
  if (rateLimitRes) return rateLimitRes;

  try {
    await requireAdmin();
  } catch (e) {
    return mapAuthErrorToResponse(e, requestId);
  }

  try {
    const sp = request.nextUrl.searchParams;
    const parsed = QuerySchema.safeParse({
      page: sp.get("page") ?? undefined,
      pageSize: sp.get("pageSize") ?? undefined,
      route: sp.get("route") ?? undefined,
      method: sp.get("method") ?? undefined,
      statusMin: sp.get("statusMin") ?? undefined,
      statusMax: sp.get("statusMax") ?? undefined,
      userId: sp.get("userId") ?? undefined,
      since: sp.get("since") ?? undefined,
      includeIp: sp.get("includeIp") ?? undefined,
    });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return fail(first?.message ?? "Invalid query", {
        code: "VALIDATION_ERROR",
        status: 400,
        requestId,
      });
    }
    const { page, pageSize, route, method, statusMin, statusMax, userId, since, includeIp } =
      parsed.data;

    const where: Prisma.RequestLogWhereInput = {};
    if (route) where.route = { contains: route, mode: "insensitive" };
    if (method) where.method = method;
    if (userId) where.userId = userId;
    if (since) where.createdAt = { gte: new Date(since) };
    if (statusMin !== undefined || statusMax !== undefined) {
      where.statusCode = {
        ...(statusMin !== undefined ? { gte: statusMin } : {}),
        ...(statusMax !== undefined ? { lte: statusMax } : {}),
      };
    }

    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      prisma.requestLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          requestId: true,
          route: true,
          method: true,
          statusCode: true,
          durationMs: true,
          userId: true,
          createdAt: true,
          ...(includeIp ? { ip: true } : {}),
        },
      }),
      prisma.requestLog.count({ where }),
    ]);

    return ok(
      {
        items: items.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        })),
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      requestId
    );
  } catch {
    return fail("Failed to load request logs", {
      code: "INTERNAL_ERROR",
      status: 500,
      requestId,
    });
  }
}
