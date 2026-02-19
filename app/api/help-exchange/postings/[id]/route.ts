/**
 * PATCH /api/help-exchange/postings/[id] — update posting status (creator only: FILLED, CLOSED).
 */

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { logError } from "@/lib/logger";
import { getRequestId } from "@/lib/request-id";
import { HelpExchangeStatusSchema } from "@/lib/validators";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Unauthorized", { code: "UNAUTHORIZED", status: 401, requestId });

    const { id } = await params;
    const posting = await prisma.helpExchangePosting.findUnique({
      where: { id },
      select: { id: true, createdById: true, status: true },
    });

    if (!posting) return fail("Posting not found", { code: "NOT_FOUND", status: 404, requestId });
    if (posting.createdById !== user.id) return fail("Forbidden", { code: "FORBIDDEN", status: 403, requestId });

    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) return fail(parseError, { code: "INVALID_JSON", status: 400, requestId });

    const validation = HelpExchangeStatusSchema.safeParse(body?.status);
    if (!validation.success) {
      const first = validation.error.issues[0];
      return fail(first?.message ?? "Invalid status", { code: "VALIDATION_ERROR", status: 400, requestId });
    }

    const newStatus = validation.data;
    if (newStatus !== "FILLED" && newStatus !== "CLOSED") {
      return fail("Only FILLED or CLOSED can be set", { code: "VALIDATION_ERROR", status: 400, requestId });
    }

    const updated = await prisma.helpExchangePosting.update({
      where: { id },
      data: { status: newStatus },
    });

    return ok({ posting: { id: updated.id, status: updated.status } }, requestId);
  } catch (e) {
    logError("help-exchange/postings/[id]/PATCH", e, {
      requestId,
      path: "/api/help-exchange/postings/[id]",
      method: "PATCH",
    });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
