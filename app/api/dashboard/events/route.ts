/**
 * GET /api/dashboard/events — list producer's events (upcoming first).
 * POST /api/dashboard/events — create event (name, location, eventDate, eventHours?).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProducerOrAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireProducerOrAdmin();
    const events = await prisma.event.findMany({
      where: { userId: user.id },
      orderBy: { eventDate: "asc" },
    });
    return NextResponse.json({
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
    const message = e instanceof Error ? e.message : "Forbidden";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireProducerOrAdmin();
    const body = await request.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    const location = String(body.location ?? "").trim();
    if (!name || !location) {
      return NextResponse.json({ error: "Name and location required" }, { status: 400 });
    }
    const eventDate = body.eventDate ? new Date(body.eventDate) : null;
    if (!eventDate || Number.isNaN(eventDate.getTime())) {
      return NextResponse.json({ error: "Valid event date required" }, { status: 400 });
    }
    const eventHours = body.eventHours != null ? String(body.eventHours).trim() || null : null;
    const event = await prisma.event.create({
      data: {
        userId: user.id,
        name,
        location,
        eventDate,
        eventHours,
        allowPreorder: Boolean(body.allowPreorder !== false),
      },
    });
    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        location: event.location,
        eventDate: event.eventDate.toISOString(),
        eventHours: event.eventHours,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create event";
    return NextResponse.json(
      { error: message },
      { status: e instanceof Error && e.message === "Forbidden" ? 403 : 400 }
    );
  }
}
