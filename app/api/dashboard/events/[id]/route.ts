/**
 * PATCH /api/dashboard/events/[id] — update event.
 * DELETE /api/dashboard/events/[id] — delete event.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProducerOrAdmin } from "@/lib/auth";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request, undefined, requestId);
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await requireProducerOrAdmin();
    const { id } = await params;
    if (!id) return fail("Missing id", { code: "VALIDATION_ERROR", status: 400 });
    const existing = await prisma.event.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return fail("Event not found", { code: "NOT_FOUND", status: 404 });
    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) return fail(parseError, { code: "INVALID_JSON", status: 400 });
    const name = body?.name !== undefined ? String(body.name).trim() : undefined;
    const location = body?.location !== undefined ? String(body.location).trim() : undefined;
    const eventDate = body?.eventDate ? new Date(body.eventDate) : undefined;
    const eventHours = body?.eventHours !== undefined ? (String(body.eventHours).trim() || null) : undefined;
    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(location !== undefined && { location }),
        ...(eventDate !== undefined && !Number.isNaN(eventDate.getTime()) && { eventDate }),
        ...(eventHours !== undefined && { eventHours }),
      },
    });
    return ok({
      event: {
        id: event.id,
        name: event.name,
        location: event.location,
        eventDate: event.eventDate.toISOString(),
        eventHours: event.eventHours,
      },
    });
  } catch (e) {
    logError("dashboard/events/[id]/PATCH", e, { requestId, path: "/api/dashboard/events/[id]", method: "PATCH" });
    const message = e instanceof Error ? e.message : "";
    if (message === "Forbidden") return fail(message, { code: "FORBIDDEN", status: 403 });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request, undefined, requestId);
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await requireProducerOrAdmin();
    const { id } = await params;
    if (!id) return fail("Missing id", { code: "VALIDATION_ERROR", status: 400 });
    const existing = await prisma.event.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return fail("Event not found", { code: "NOT_FOUND", status: 404 });
    await prisma.event.delete({ where: { id } });
    return ok(undefined);
  } catch (e) {
    logError("dashboard/events/[id]/DELETE", e, { requestId, path: "/api/dashboard/events/[id]", method: "DELETE" });
    const message = e instanceof Error ? e.message : "";
    if (message === "Forbidden") return fail(message, { code: "FORBIDDEN", status: 403 });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
