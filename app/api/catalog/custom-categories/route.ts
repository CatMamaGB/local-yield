/**
 * POST /api/catalog/custom-categories — create a custom category (status PENDING).
 * Producer only. Immediately available to the creator; visible to others after admin approval.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProducerOrAdmin } from "@/lib/auth";
import { PREDEFINED_GROUP_IDS } from "@/lib/catalog-categories";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request, undefined, requestId);
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await requireProducerOrAdmin();
    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) return fail(parseError, { code: "INVALID_JSON", status: 400 });

    const name = String(body?.name ?? "").trim();
    if (!name) return fail("Name is required", { code: "VALIDATION_ERROR", status: 400 });
    const groupId = body?.groupId != null ? String(body.groupId).trim() || null : null;
    if (groupId != null && !PREDEFINED_GROUP_IDS.includes(groupId)) return fail("Invalid group", { code: "VALIDATION_ERROR", status: 400 });
    const defaultImageUrl = body?.defaultImageUrl != null ? String(body.defaultImageUrl).trim() || null : null;

    const customCategory = await prisma.customCategory.create({
      data: {
        name,
        groupId,
        defaultImageUrl,
        createdById: user.id,
        status: "PENDING",
      },
    });

    return ok({
      customCategory: {
        id: customCategory.id,
        name: customCategory.name,
        correctedName: customCategory.correctedName,
        status: customCategory.status,
        groupId: customCategory.groupId,
        defaultImageUrl: customCategory.defaultImageUrl,
        isMine: true,
      },
    });
  } catch (e) {
    logError("catalog/custom-categories/POST", e, { requestId, path: "/api/catalog/custom-categories", method: "POST" });
    const message = e instanceof Error ? e.message : "";
    if (message === "Forbidden") return fail(message, { code: "FORBIDDEN", status: 403 });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
