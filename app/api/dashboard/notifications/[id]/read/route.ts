/**
 * PATCH /api/dashboard/notifications/[id]/read - Mark notification as read.
 */

import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail, withRequestId } from "@/lib/api";
import { logError } from "@/lib/logger";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = withRequestId(request);
  const user = await getCurrentUser();
  if (!user) {
    return fail("Unauthorized", { code: "UNAUTHORIZED", status: 401, requestId });
  }

  const { id } = await params;

  try {
    const notification = await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { read: true },
    });
    if (notification.count === 0) {
      return fail("Notification not found", { code: "NOT_FOUND", status: 404, requestId });
    }
    return ok({ ok: true }, requestId);
  } catch (error) {
    logError("dashboard/notifications/[id]/read/PATCH", error, {
      requestId,
      path: "/api/dashboard/notifications/[id]/read",
      method: "PATCH",
    });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
