/**
 * GET /api/dashboard/events — list producer's events (upcoming first).
 * POST /api/dashboard/events — create event (name, location, eventDate, eventHours?).
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProducerOrAdmin } from "@/lib/auth";
import { ok, fail, parseJsonBody } from "@/lib/api";
import { logError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestId } from "@/lib/request-id";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  try {
    const user = await requireProducerOrAdmin();
    const events = await prisma.event.findMany({
      where: { userId: user.id },
      orderBy: { eventDate: "asc" },
    });
    return ok({
      events: events.map((e) => ({
        id: e.id,
        name: e.name,
        location: e.location,
        eventDate: e.eventDate.toISOString(),
        eventHours: e.eventHours,
        allowPreorder: e.allowPreorder,
      })),
    });
  } catch (e) {
    logError("dashboard/events/GET", e, { requestId, path: "/api/dashboard/events", method: "GET" });
    const message = e instanceof Error ? e.message : "Forbidden";
    return fail(message, { code: "FORBIDDEN", status: 403 });
  }
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const rateLimitRes = await checkRateLimit(request, undefined, requestId);
  if (rateLimitRes) return rateLimitRes;

  try {
    const user = await requireProducerOrAdmin();
    const { data: body, error: parseError } = await parseJsonBody(request);
    if (parseError) return fail(parseError, { code: "INVALID_JSON", status: 400 });

    const name = String(body?.name ?? "").trim();
    const location = String(body?.location ?? "").trim();
    if (!name || !location) return fail("Name and location required", { code: "VALIDATION_ERROR", status: 400 });
    const eventDate = body?.eventDate ? new Date(body.eventDate) : null;
    if (!eventDate || Number.isNaN(eventDate.getTime())) return fail("Valid event date required", { code: "VALIDATION_ERROR", status: 400 });
    const eventHours = body?.eventHours != null ? String(body.eventHours).trim() || null : null;
    const event = await prisma.event.create({
      data: {
        userId: user.id,
        name,
        location,
        eventDate,
        eventHours,
        allowPreorder: Boolean(body?.allowPreorder !== false),
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
    logError("dashboard/events/POST", e, { requestId, path: "/api/dashboard/events", method: "POST" });
    const message = e instanceof Error ? e.message : "";
    if (message === "Forbidden") return fail(message, { code: "FORBIDDEN", status: 403 });
    return fail("Something went wrong", { code: "INTERNAL_ERROR", status: 500, requestId });
  }
}
